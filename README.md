# BSON ⇄ JSON Converter

완전히 독립된 양방향 BSON/JSON 변환 도구

---

## 📁 프로젝트 구조

```
bson-json-converter/
 │
 ├── 📂 bson-to-json/              ← BSON → JSON 변환
 │   ├── 📂 input/                 (BSON 파일 넣는 곳)
 │   ├── 📂 output/                (JSON 파일 나오는 곳)
 │   ├── convert.js                (변환 스크립트)
 │   ├── convert.bat               (실행 파일)
 │   └── README.md
 │
 ├── 📂 json-to-bson/              ← JSON → BSON 변환
 │   ├── 📂 input/                 (JSON 파일 넣는 곳)
 │   ├── 📂 output/                (BSON + 메타데이터 나오는 곳)
 │   ├── convert.js                (변환 스크립트)
 │   ├── convert.bat               (실행 파일)
 │   └── README.md
 │
 ├── 📦 package.json               (공통 의존성)
 └── 📖 README.md                  (이 파일)
```

---

## 🚀 Quick Start

### ① BSON → JSON 변환

1. **`bson-to-json/input/`** 폴더에 `.bson` 파일 넣기
2. **`bson-to-json/convert.bat`** 더블클릭
3. **`bson-to-json/output/날짜시간/`** 폴더에서 `.json` 파일 확인

### ② JSON → BSON 변환

1. **`json-to-bson/input/`** 폴더에 `.json` 파일 넣기
2. **`json-to-bson/convert.bat`** 더블클릭
3. **`json-to-bson/output/날짜시간/`** 폴더에서 결과 확인:
   - `파일명.bson`
   - `파일명_metadata.json`

> 💡 **각 변환 기능이 완전히 독립된 폴더**로 구성되어 있어 혼동 없이 사용 가능!

---

## 💻 시스템 요구사항

- **Node.js** (https://nodejs.org/)
- 배치 파일이 첫 실행 시 필요한 패키지를 자동으로 설치합니다

---

## ✨ 주요 기능

### 공통
- ✅ **완전 독립 구조** - 각 변환 기능이 자체 폴더 보유
- ✅ **원클릭 실행** - 각 폴더의 `convert.bat` 더블클릭
- ✅ **일괄 변환** - 여러 파일 한 번에 처리
- ✅ **대용량 지원** - 16MB 청크 스트리밍 방식
- ✅ **UTF-8 완벽 지원** - 모든 언어 처리
- ✅ **실시간 진행률** - 파일 크기, 문서 개수, 처리 시간
- ✅ **타임스탬프 폴더** - 결과를 날짜시간별로 자동 분류

### BSON → JSON
- 📝 가독성 좋은 포맷 (들여쓰기 2칸)
- 🔍 다중 BSON 문서 자동 감지 및 배열로 저장
- 🛡️ 손상 문서 건너뛰기

### JSON → BSON
- 📋 상세한 메타데이터 자동 생성
- 📊 압축률 비교 (JSON vs BSON)
- 🔬 데이터 타입 자동 분석
- 📦 단일/다중 문서 자동 구분

---

## 📋 메타데이터 예시

`json-to-bson/output/` 폴더에 생성되는 메타데이터:

```json
{
  "sourceFile": "data.json",
  "conversionDate": "2026-02-04T09:45:00.000Z",
  "documentCount": 150,
  "isArray": true,
  "totalSize": 2048576,
  "totalBsonSize": 1835008,
  "compressionRatio": "89.56%",
  "documents": [
    {
      "index": 0,
      "size": 12234,
      "fieldCount": 8,
      "fields": ["_id", "name", "email", ...],
      "dataTypes": {
        "_id": "ObjectId",
        "name": "string",
        "email": "string",
        "createdAt": "Date"
      }
    }
  ]
}
```

---

## 🖥️ 명령줄 사용법

배치 파일 대신 명령줄을 선호하시면:

```bash
# 패키지 설치 (처음 한번만, 루트에서)
npm install

# BSON → JSON 변환
cd bson-to-json
node convert.js

# JSON → BSON 변환
cd json-to-bson
node convert.js
```

---

## 🎯 설계 철학

### 완전 독립 구조
각 변환 기능은 **자체적으로 완결된 폴더**를 가지고 있습니다:
- 각자의 `input/output/` 폴더
- 각자의 `convert.js` 및 `convert.bat`
- 각자의 `README.md`

### 혼동 방지
- 폴더 이름만 봐도 기능 파악 가능
- 입력/출력 폴더가 변환 폴더 안에 있어 명확
- 실행 파일도 각 폴더 안에 위치

### 확장 용이
- 새로운 변환 기능 추가 시 새 폴더만 만들면 됨
- 각 기능이 독립적이라 수정이 다른 기능에 영향 없음

---

## 🔧 Troubleshooting

### ❌ "Node.js not found" 오류
→ https://nodejs.org/ 에서 Node.js 설치

### ❌ 파일이 변환되지 않음
→ 올바른 폴더의 `input/`에 파일이 있는지 확인

### ❌ 인코딩 문제
→ 파일은 UTF-8로 올바르게 저장됩니다

### ❌ Invalid JSON 오류
→ JSON 파일 형식 확인

### ❓ BSON이 JSON보다 큼
→ 정상입니다! BSON은 메타데이터 포함

---

## 📄 라이선스

ISC License

---

**Made with ❤️ for easy BSON ⇄ JSON conversion**
