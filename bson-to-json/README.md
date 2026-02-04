# BSON → JSON Converter

BSON 파일을 JSON으로 변환합니다.

## 사용 방법

1. **`input`** 폴더에 `.bson` 파일을 넣으세요
2. **`convert.bat`** 더블클릭
3. **`output/날짜시간/`** 폴더에서 변환된 `.json` 파일 확인

## 기능

- ✅ 대용량 파일 지원 (16MB 스트리밍)
- ✅ 다중 BSON 문서 자동 감지
- ✅ 실시간 진행률 표시
- ✅ UTF-8 인코딩 지원

## 폴더 구조

```
bson-to-json/
 ├── input/          ← BSON 파일 넣는 곳
 ├── output/         ← JSON 파일 나오는 곳
 ├── convert.js      ← 변환 스크립트
 └── convert.bat     ← 실행 파일
```

