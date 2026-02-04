import { readFileSync, createWriteStream, readdirSync, existsSync, mkdirSync, statSync, writeFileSync } from 'fs';
import { join, extname, basename } from 'path';
import { BSON } from 'bson';

// 설정
const INPUT_FOLDER = './input'; // JSON 파일을 넣을 폴더
const OUTPUT_FOLDER = './output'; // BSON과 메타데이터 파일이 생성될 폴더
const CHUNK_SIZE = 16 * 1024 * 1024; // 16MB씩 쓰기 (메모리 효율적)

console.log('🔄 JSON → BSON 자동 변환 시작\n');
console.log('💡 단일/다중 문서 및 메타데이터 생성 지원\n');

// 파일 크기를 읽기 쉽게 포맷
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// 폴더 생성 (없으면)
if (!existsSync(INPUT_FOLDER)) {
    mkdirSync(INPUT_FOLDER, { recursive: true });
    console.log(`📁 ${INPUT_FOLDER} 폴더가 생성되었습니다.`);
    console.log(`   이 폴더에 JSON 파일을 넣고 다시 실행하세요.\n`);
    process.exit(0);
}

if (!existsSync(OUTPUT_FOLDER)) {
    mkdirSync(OUTPUT_FOLDER, { recursive: true });
    console.log(`📁 ${OUTPUT_FOLDER} 폴더가 생성되었습니다.\n`);
}

// input 폴더에서 모든 JSON 파일 찾기
const files = readdirSync(INPUT_FOLDER);
const jsonFiles = files.filter((file) => extname(file).toLowerCase() === '.json');

if (jsonFiles.length === 0) {
    console.log(`⚠️  ${INPUT_FOLDER} 폴더에 JSON 파일이 없습니다.`);
    console.log(`   .json 파일을 ${INPUT_FOLDER} 폴더에 넣고 다시 실행하세요.\n`);
    process.exit(0);
}

console.log(`📊 총 ${jsonFiles.length}개의 JSON 파일을 발견했습니다.\n`);

// 날짜시간 형식 생성 함수
function getDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// 변환 시작 시간 (모든 파일을 같은 폴더에 저장)
const conversionDateTime = getDateTime();
const outputSessionFolder = join(OUTPUT_FOLDER, conversionDateTime);

// 출력 세션 폴더 생성
if (!existsSync(outputSessionFolder)) {
    mkdirSync(outputSessionFolder, { recursive: true });
}

console.log(`📁 출력 폴더: ${outputSessionFolder}\n`);

// JSON 데이터 타입 분석 함수
function analyzeDataTypes(obj, prefix = '') {
    const types = {};
    
    if (Array.isArray(obj)) {
        types[prefix || 'root'] = 'array';
        if (obj.length > 0) {
            // 배열의 첫 번째 요소로 타입 분석
            Object.assign(types, analyzeDataTypes(obj[0], prefix ? `${prefix}[0]` : '[0]'));
        }
    } else if (obj && typeof obj === 'object') {
        if (obj._bsontype) {
            types[prefix || 'root'] = obj._bsontype;
        } else if (obj.$oid) {
            types[prefix || 'root'] = 'ObjectId';
        } else if (obj.$date) {
            types[prefix || 'root'] = 'Date';
        } else if (obj.$numberLong) {
            types[prefix || 'root'] = 'Long';
        } else if (obj.$numberDecimal) {
            types[prefix || 'root'] = 'Decimal128';
        } else {
            types[prefix || 'root'] = 'object';
            for (const [key, value] of Object.entries(obj)) {
                const newPrefix = prefix ? `${prefix}.${key}` : key;
                Object.assign(types, analyzeDataTypes(value, newPrefix));
            }
        }
    } else {
        types[prefix || 'root'] = typeof obj;
    }
    
    return types;
}

// JSON 파일을 읽어서 BSON으로 변환하고 메타데이터 생성
async function convertJsonToBson(inputPath, outputPath, metadataPath) {
    return new Promise((resolve, reject) => {
        try {
            console.log('   📖 JSON 파일 읽는 중...');
            
            // JSON 파일 읽기
            const jsonData = readFileSync(inputPath, 'utf8');
            const fileSize = statSync(inputPath).size;
            console.log(`   ✓ 파일 읽기 완료: ${formatFileSize(fileSize)}`);
            
            console.log('   🔍 JSON 파싱 중...');
            const data = JSON.parse(jsonData);
            
            // 배열인지 단일 객체인지 확인
            const isArray = Array.isArray(data);
            const documents = isArray ? data : [data];
            const docCount = documents.length;
            
            console.log(`   ✓ ${docCount}개 문서 발견`);
            
            // 메타데이터 생성
            console.log('   📝 메타데이터 생성 중...');
            const metadata = {
                sourceFile: basename(inputPath),
                conversionDate: new Date().toISOString(),
                documentCount: docCount,
                isArray: isArray,
                totalSize: fileSize,
                documents: []
            };
            
            // BSON 변환 및 쓰기
            console.log('   💾 BSON 파일 생성 중...');
            const writeStream = createWriteStream(outputPath);
            
            let totalBsonSize = 0;
            let processedDocs = 0;
            
            for (const doc of documents) {
                try {
                    // BSON으로 직렬화
                    const bsonBuffer = BSON.serialize(doc);
                    writeStream.write(bsonBuffer);
                    
                    totalBsonSize += bsonBuffer.length;
                    processedDocs++;
                    
                    // 각 문서의 메타데이터 추가
                    const docMetadata = {
                        index: processedDocs - 1,
                        size: bsonBuffer.length,
                        fieldCount: Object.keys(doc).length,
                        fields: Object.keys(doc),
                        dataTypes: analyzeDataTypes(doc)
                    };
                    
                    metadata.documents.push(docMetadata);
                    
                    if (processedDocs % 100 === 0) {
                        process.stdout.write(`\r   📄 ${processedDocs}/${docCount} 문서 변환됨...`);
                    }
                } catch (err) {
                    console.error(`\n   ⚠️  문서 ${processedDocs} 변환 실패: ${err.message}`);
                }
            }
            
            if (docCount > 1) {
                console.log(`\r   ✓ ${processedDocs}/${docCount} 문서 변환 완료` + ' '.repeat(30));
            }
            
            writeStream.end();
            
            writeStream.on('finish', () => {
                // 최종 메타데이터 추가
                metadata.totalBsonSize = totalBsonSize;
                metadata.compressionRatio = (totalBsonSize / fileSize * 100).toFixed(2) + '%';
                
                // 메타데이터 파일 저장
                console.log('   📋 메타데이터 파일 저장 중...');
                writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
                
                resolve({ 
                    success: true, 
                    docCount: processedDocs,
                    bsonSize: totalBsonSize,
                    jsonSize: fileSize,
                    metadata 
                });
            });
            
            writeStream.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

// 각 JSON 파일을 BSON으로 변환
let successCount = 0;
let failCount = 0;

for (const filename of jsonFiles) {
    try {
        const inputPath = join(INPUT_FOLDER, filename);
        
        // 파일 크기 확인
        const fileStats = statSync(inputPath);
        const fileSize = formatFileSize(fileStats.size);
        
        // 파일명에서 확장자만 .bson으로 변경
        const baseName = filename.replace(/\.json$/i, '');
        const outputFilename = `${baseName}.bson`;
        const metadataFilename = `${baseName}_metadata.json`;
        const outputPath = join(outputSessionFolder, outputFilename);
        const metadataPath = join(outputSessionFolder, metadataFilename);
        
        console.log(`\n📖 변환 중: ${filename} (${fileSize})`);
        
        const startTime = Date.now();
        const result = await convertJsonToBson(inputPath, outputPath, metadataPath);
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        const ratio = ((result.bsonSize / result.jsonSize) * 100).toFixed(1);
        
        if (result.docCount > 1) {
            console.log(`✅ 완료: ${outputFilename} (${result.docCount}개 문서, ${formatFileSize(result.bsonSize)}, ${ratio}%, ${elapsedTime}초)`);
            console.log(`   📋 메타데이터: ${metadataFilename}\n`);
        } else {
            console.log(`✅ 완료: ${outputFilename} (${formatFileSize(result.bsonSize)}, ${ratio}%, ${elapsedTime}초)`);
            console.log(`   📋 메타데이터: ${metadataFilename}\n`);
        }
        successCount++;
    } catch (error) {
        console.error(`\n❌ 실패: ${filename}`);
        console.error(`   오류: ${error.message}\n`);
        failCount++;
    }
}

// 결과 요약
console.log('═══════════════════════════════════');
console.log(`✨ 변환 완료!`);
console.log(`   성공: ${successCount}개`);
console.log(`   실패: ${failCount}개`);
console.log(`   결과 위치: ${outputSessionFolder}`);
console.log('═══════════════════════════════════\n');

