#!/bin/zsh
cd "$(dirname "$0")"
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')
echo "Dang mo Amunra Admin tai http://127.0.0.1:${PORT}/admin.html"
echo "Dong cua so Terminal nay khi ban khong dung nua."
python3 -m http.server "$PORT" --bind 127.0.0.1 > /tmp/amunra-mobile-server.log 2>&1 &
SERVER_PID=$!
sleep 1
open "http://127.0.0.1:${PORT}/admin.html"
wait "$SERVER_PID"
