# BSON to JSON Converter

대용량 파일 및 다중 문서를 지원하는 BSON to JSON 변환 도구

## Quick Start

1. `input` 폴더에 `.bson` 파일을 넣으세요
2. `convert.bat` 더블클릭
3. `output` 폴더에서 변환된 `.json` 파일을 확인하세요

That's it! 🎉

## Folder Structure

```
📂 bson to json converter
 ├── 📂 input          ← Put BSON files here
 ├── 📂 output         ← JSON files appear here
 └── 🚀 convert.bat    ← Double-click to run
```

## Requirements

- Node.js (https://nodejs.org/)
- The batch file will auto-install required packages on first run

## Features

✅ 원클릭 실행
✅ 여러 파일 일괄 변환
✅ 패키지 자동 설치
✅ UTF-8 지원 (한글, 중국어 등)
✅ 보기 좋게 포맷된 JSON 출력
✅ **대용량 파일 지원** (메모리 효율적인 스트리밍 방식)
✅ **다중 BSON 문서 지원** (하나의 파일에 여러 문서가 있어도 자동 처리)

## 주요 기능

- **스트리밍 처리**: 16MB씩 나눠서 읽어 메모리 부담 최소화
- **다중 문서 자동 감지**: 하나의 BSON 파일에 여러 문서가 있으면 배열로 저장
- **실시간 진행 상황**: 파일 크기, 문서 개수, 처리 시간 표시
- **자동 복구**: 일부 문서가 손상되어도 나머지 문서는 계속 처리

## Manual Usage

명령줄 사용을 선호하시면:

```bash
cd "c:\Users\admin\Downloads\0. 중요\bson을 json으로 변환하는 프로그램"
npm install    # 처음 한번만
npm start      # 변환 실행
```
