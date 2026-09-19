#!/bin/zsh
cd -- "${0:A:h}/files" || exit 1
print 'ブラウザで http://127.0.0.1:8000/ を開いてください。'
print 'このウインドウは利用中そのままにしてください。終了は Control+C。'
python3 -m http.server 8000 --bind 127.0.0.1
