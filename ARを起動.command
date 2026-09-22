#!/bin/zsh
cd -- "${0:A:h}" || exit 1
set -u
port=8000
url="http://127.0.0.1:${port}/"

if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
  print "すでにサーバーが起動しています。ブラウザで ${url} を開いてください。"
  exit 0
fi

if lsof -nP -iTCP:${port} -sTCP:LISTEN >/dev/null 2>&1; then
  print -u2 "ポート${port}は別のアプリケーションが使用中です。既存のサーバーを終了してから再実行してください。"
  exit 1
fi

print "ブラウザで ${url} を開いてください。"
print 'このウインドウは利用中そのままにしてください。終了は Control+C。'
exec python3 -m http.server "$port" --bind 127.0.0.1
