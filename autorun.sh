#! /bin/sh

#bin/stf migrate &

bin/stf triproxy app001 --bind-pub tcp://127.0.0.1:7111 --bind-dealer tcp://127.0.0.1:7112 --bind-pull tcp://127.0.0.1:7113 &

bin/stf triproxy dev001 --bind-pub tcp://127.0.0.1:7114 --bind-dealer tcp://127.0.0.1:7115 --bind-pull tcp://127.0.0.1:7116 &

bin/stf processor proc001 --connect-app-dealer tcp://127.0.0.1:7112 --connect-dev-dealer tcp://127.0.0.1:7115 &

bin/stf processor proc002 --connect-app-dealer tcp://127.0.0.1:7112 --connect-dev-dealer tcp://127.0.0.1:7115 &

bin/stf reaper reaper001 --connect-push tcp://127.0.0.1:7116 --connect-sub tcp://127.0.0.1:7111 &

bin/stf provider --name liuchang --min-port 7400 --max-port 7700 --connect-sub tcp://127.0.0.1:7114 --connect-push tcp://127.0.0.1:7116 --group-timeout 900 --public-ip localhost --storage-url http://localhost:7100/ --adb-host 127.0.0.1 --adb-port 5037 --vnc-initial-size 600x800 --mute-master never &

bin/stf auth-mock --port 7120 --secret kute kittykat --app-url http://localhost:7100/ &

bin/stf app --port 7105 --secret kute kittykat --auth-url http://localhost:7100/auth/mock/ --websocket-url http://localhost:7110/ &

bin/stf api --port 7106 --secret kute kittykat --connect-push tcp://127.0.0.1:7113 --connect-sub tcp://127.0.0.1:7111 &

#bin/stf websocket --port 7110 --secret kute kittykat --storage-url http://localhost:7100/ --connect-sub tcp://127.0.0.1:7111 --connect-push tcp://127.0.0.1:7113 &

bin/stf storage-temp --port 7102 &

bin/stf storage-plugin-image --port 7103 --storage-url http://localhost:7100/ &

bin/stf storage-plugin-apk --port 7104 --storage-url http://localhost:7100/ &


bin/stf poorxy --port 7100 --app-url http://localhost:7105/ --auth-url http://localhost:7120/ --api-url http://localhost:7106/ --websocket-url http://localhost:7110/ --storage-url http://localhost:7102/ --storage-plugin-image-url http://localhost:7103/ --storage-plugin-apk-url http://localhost:7104/ &
