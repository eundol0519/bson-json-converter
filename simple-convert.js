import { createReadStream, createWriteStream, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { BSON } from 'bson';

// 설정
const INPUT_FOLDER = './input'; // BSON 파일을 넣을 폴더
const OUTPUT_FOLDER = './output'; // JSON 파일이 생성될 폴더
const CHUNK_SIZE = 16 * 1024 * 1024; // 16MB씩 읽기 (메모리 효율적)

console.log('🔄 BSON → JSON 자동 변환 시작\n');
console.log('💡 대용량 파일 및 다중 문서 지원\n');

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
    console.log(`   이 폴더에 BSON 파일을 넣고 다시 실행하세요.\n`);
    process.exit(0);
}

if (!existsSync(OUTPUT_FOLDER)) {
    mkdirSync(OUTPUT_FOLDER, { recursive: true });
    console.log(`📁 ${OUTPUT_FOLDER} 폴더가 생성되었습니다.\n`);
}

// input 폴더에서 모든 BSON 파일 찾기
const files = readdirSync(INPUT_FOLDER);
const bsonFiles = files.filter((file) => extname(file).toLowerCase() === '.bson');

if (bsonFiles.length === 0) {
    console.log(`⚠️  ${INPUT_FOLDER} 폴더에 BSON 파일이 없습니다.`);
    console.log(`   .bson 파일을 ${INPUT_FOLDER} 폴더에 넣고 다시 실행하세요.\n`);
    process.exit(0);
}

console.log(`📊 총 ${bsonFiles.length}개의 BSON 파일을 발견했습니다.\n`);

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

// BSON 파일을 스트리밍으로 읽어서 JSON으로 변환
// 여러 개의 BSON 문서를 순차적으로 처리
async function convertBsonToJson(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let totalSize = 0;

        const readStream = createReadStream(inputPath, { highWaterMark: CHUNK_SIZE });

        readStream.on('data', (chunk) => {
            chunks.push(chunk);
            totalSize += chunk.length;
            process.stdout.write(`\r   읽는 중: ${formatFileSize(totalSize)}`);
        });

        readStream.on('end', () => {
            try {
                console.log('\r   ✓ 파일 읽기 완료' + ' '.repeat(30));
                console.log('   📝 BSON 문서 파싱 중...');

                // 모든 청크를 하나의 Buffer로 합치기
                const bsonData = Buffer.concat(chunks);
                chunks.length = 0; // 메모리 정리

                // 여러 BSON 문서를 순차적으로 읽기
                const documents = [];
                let offset = 0;
                let docCount = 0;

                while (offset < bsonData.length) {
                    // BSON 문서의 크기는 처음 4바이트에 저장됨 (little-endian)
                    if (offset + 4 > bsonData.length) {
                        break;
                    }

                    const docSize = bsonData.readInt32LE(offset);

                    // 문서 크기 유효성 검사
                    if (docSize < 5 || docSize > bsonData.length - offset) {
                        break;
                    }

                    // 문서 추출
                    const docBuffer = bsonData.slice(offset, offset + docSize);

                    try {
                        const doc = BSON.deserialize(docBuffer);
                        documents.push(doc);
                        docCount++;

                        if (docCount % 100 === 0) {
                            process.stdout.write(`\r   📄 ${docCount}개 문서 파싱됨...`);
                        }
                    } catch (err) {
                        // 문서 파싱 실패 시 건너뛰기
                    }

                    offset += docSize;
                }

                if (docCount > 0) {
                    console.log(`\r   ✓ 총 ${docCount}개 문서 파싱 완료` + ' '.repeat(30));
                }

                console.log('   💾 JSON 파일로 저장 중...');

                // 스트리밍으로 JSON 파일 쓰기
                const writeStream = createWriteStream(outputPath, { encoding: 'utf8' });

                // 단일 문서인 경우 객체로, 여러 문서인 경우 배열로 저장
                let jsonString;
                if (documents.length === 1) {
                    jsonString = JSON.stringify(documents[0], null, 2);
                } else {
                    jsonString = JSON.stringify(documents, null, 2);
                }

                writeStream.write(jsonString);
                writeStream.end();

                writeStream.on('finish', () => {
                    resolve({ success: true, docCount });
                });

                writeStream.on('error', reject);
            } catch (error) {
                reject(error);
            }
        });

        readStream.on('error', reject);
    });
}

// 각 BSON 파일을 JSON으로 변환
let successCount = 0;
let failCount = 0;

for (const filename of bsonFiles) {
    try {
        const inputPath = join(INPUT_FOLDER, filename);

        // 파일 크기 확인
        const fileStats = statSync(inputPath);
        const fileSize = formatFileSize(fileStats.size);

        // 파일명에서 확장자만 .json으로 변경
        const baseName = filename.replace(/\.bson$/i, '');
        const outputFilename = `${baseName}.json`;
        const outputPath = join(outputSessionFolder, outputFilename);

        console.log(`\n📖 변환 중: ${filename} (${fileSize})`);

        const startTime = Date.now();
        const result = await convertBsonToJson(inputPath, outputPath);
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

        if (result.docCount > 1) {
            console.log(`✅ 완료: ${outputFilename} (${result.docCount}개 문서, ${elapsedTime}초)\n`);
        } else {
            console.log(`✅ 완료: ${outputFilename} (${elapsedTime}초)\n`);
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
