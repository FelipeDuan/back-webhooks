#!/usr/bin/env bash
# Testes de requisições ao backend (local ou produção).
# Uso: ./scripts/test-backend.sh [BASE_URL]
# Ex.: ./scripts/test-backend.sh
#      ./scripts/test-backend.sh https://back-webhooks.felipeduan.com
#      ./scripts/test-backend.sh http://localhost:3100

set -e
BASE_URL="${1:-https://back-webhooks.felipeduan.com}"

echo "=== Testando backend em: $BASE_URL ==="
echo ""

# 1. Capture (público)
echo "1. POST /capture/payment/webhook"
CAPTURE_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/capture/payment/webhook" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.completed","amount":99.90,"currency":"BRL"}')
CAPTURE_BODY=$(echo "$CAPTURE_RESP" | head -n -1)
CAPTURE_STATUS=$(echo "$CAPTURE_RESP" | tail -n 1)
echo "   Status: $CAPTURE_STATUS"
echo "   Body: $CAPTURE_BODY"
if [ "$CAPTURE_STATUS" != "200" ]; then
  echo "   ERRO: esperado 200"
fi
echo ""

# 2. Listar webhooks (sem Origin = permitido)
echo "2. GET /api/webhooks"
WEBHOOKS_RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/webhooks?limit=3")
WEBHOOKS_BODY=$(echo "$WEBHOOKS_RESP" | head -n -1)
WEBHOOKS_STATUS=$(echo "$WEBHOOKS_RESP" | tail -n 1)
echo "   Status: $WEBHOOKS_STATUS"
echo "   Body (primeiras linhas):"
echo "$WEBHOOKS_BODY" | head -n 20
if [ "$WEBHOOKS_STATUS" != "200" ]; then
  echo "   ERRO: esperado 200"
fi
echo ""

# Extrair primeiro ID se existir (para testes seguintes)
FIRST_ID=$(echo "$WEBHOOKS_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 3. GET por ID (se tiver ID)
if [ -n "$FIRST_ID" ]; then
  echo "3. GET /api/webhooks/$FIRST_ID"
  GET_ONE_RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/webhooks/$FIRST_ID")
  GET_ONE_STATUS=$(echo "$GET_ONE_RESP" | tail -n 1)
  echo "   Status: $GET_ONE_STATUS"
  if [ "$GET_ONE_STATUS" != "200" ] && [ "$GET_ONE_STATUS" != "404" ]; then
    echo "   ERRO: esperado 200 ou 404"
  fi
  echo ""

  # 4. POST /api/generate
  echo "4. POST /api/generate (webhookIds: [$FIRST_ID])"
  GEN_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d "{\"webhookIds\":[\"$FIRST_ID\"]}")
  GEN_STATUS=$(echo "$GEN_RESP" | tail -n 1)
  echo "   Status: $GEN_STATUS"
  if [ "$GEN_STATUS" = "201" ]; then
    echo "   OK: handler gerado"
  else
    echo "   Body: $(echo "$GEN_RESP" | head -n -1 | head -c 200)..."
  fi
  echo ""

  # 5. DELETE (opcional – descomente se quiser testar deleção)
  # echo "5. DELETE /api/webhooks/$FIRST_ID"
  # DEL_RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/webhooks/$FIRST_ID")
  # DEL_STATUS=$(echo "$DEL_RESP" | tail -n 1)
  # echo "   Status: $DEL_STATUS"
  # echo ""
fi

# 6. Raiz (pode 404)
echo "6. GET / (sanity)"
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
echo "   Status: $ROOT_STATUS (404 é esperado se não houver rota em /)"
echo ""
echo "=== Fim dos testes ==="
