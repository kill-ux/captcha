curl -fsSL https://bun.com/install | bash

npm init -y
bun add fastify @fastify/cors

 docker exec -e REDISCLI_AUTH=ChangeMe123! captcha-redis \
  redis-cli  ttl "captcha-session:c4b21729-50f1-4995-b39a-dd8afb8d479d" | jq