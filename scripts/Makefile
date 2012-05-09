all: clean server clients utils app

clean:
	rm -rf bin/
	mkdir bin

server:
	cp -r src/server/ bin/server
	scripts/inject.py src/shared/model.js 'module.exports' bin/server/model.js
	cp -r lib/dashboard bin/server/plugins/debug/dashboard/static/lib

clients:
	cp -r src/client bin/client
	scripts/inject.py src/shared/model.js 'var model' bin/client/nodejs/heap.io.js
	scripts/inject.py src/shared/patterns.js 'var patterns' bin/client/nodejs/heap.io.js
	scripts/inject.py src/shared/model.js 'var model' bin/client/web/heap.io.js
	scripts/inject.py src/shared/patterns.js 'var patterns' bin/client/web/heap.io.js
	scripts/inject.py src/shared/b64.js 'var Base64' bin/client/web/heap.io.js

utils:
	cp -r src/auth-engine bin/auth-engine
	cp -r bin/client/nodejs bin/auth-engine/heap.io
	cp bin/server/config.js bin/auth-engine/config.js

	cp -r src/proxy bin/proxy
	cp -r bin/client/nodejs bin/proxy/ember/server/heap.io

app:
	cp -r apps bin/apps

	cp -r lib/apps bin/apps/test/lib
	cp -r bin/client/web bin/apps/todo/static/heap.io
	cp -r bin/client/web bin/apps/test/heap.io
	cp bin/proxy/ember/client/heap.io-ember-adapter.js bin/apps/test/heap.io/heap.io-ember-adapter.js
	
	cp -r lib/apps bin/apps/todo/static/lib
	cp -r bin/client/nodejs bin/apps/todo/dbdump/heap.io
