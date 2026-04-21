.PHONY: up down logs check typecheck test test-all e2e build clean install migrate

up:
	docker compose up -d postgres redis
	@echo "Infra up (postgres, redis)"

up-all:
	docker compose up -d --build

down:
	docker compose down

down-v:
	docker compose down -v

logs:
	docker compose logs -f --tail=100

install:
	npm install

typecheck:
	npm run typecheck

test:
	npm test

check: typecheck test

test-all: check
	$(MAKE) -C packages/backend test || true
	$(MAKE) -C packages/worker test || true
	$(MAKE) -C packages/frontend test || true

e2e:
	npx playwright install --with-deps chromium
	npx playwright test

e2e-local:
	E2E_SKIP_COMPOSE=1 npx playwright test

build:
	npm run build

migrate:
	$(MAKE) -C packages/shared migrate

clean:
	rm -rf node_modules packages/*/node_modules packages/*/dist
