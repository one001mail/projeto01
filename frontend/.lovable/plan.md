

# Integração NOWPayments para Endereços de Depósito Reais

## Objetivo
Substituir os endereços simulados por endereços reais gerados pela API do NOWPayments ao criar uma sessão de mix.

## Pré-requisitos
1. **API Key do NOWPayments** — o usuário precisa criar uma conta em [nowpayments.io](https://nowpayments.io), obter a API key no dashboard, e fornecê-la via `add_secret` como `NOWPAYMENTS_API_KEY`.

## Alterações

### 1. Armazenar secret `NOWPAYMENTS_API_KEY`
- Usar a ferramenta `add_secret` para solicitar a chave ao usuário.

### 2. Atualizar edge function `mix-session/index.ts`
- Remover a função `generateSimulatedAddress`.
- Adicionar chamada à API do NOWPayments (`POST https://api.nowpayments.io/v1/payment`) para criar um pagamento e obter o endereço de depósito real.
- Mapear moedas do app para os códigos do NOWPayments: BTC → `btc`, ETH → `eth`, LTC → `ltc`, USDT → `usdterc20`, USDC → `usdcerc20`.
- Salvar o `payment_id` do NOWPayments no log/metadata da sessão.
- Fallback: se a API falhar, retornar erro claro (sem endereço simulado).

### 3. Atualizar resposta da API
- O campo `deposit_address` virá da resposta do NOWPayments (`pay_address`).
- Adicionar campo `nowpayments_id` opcional na resposta para rastreamento.

### 4. Frontend (sem alterações significativas)
- O `MixingComplete.tsx` já exibe o `deposit_address` com QR code — continuará funcionando automaticamente.

## Detalhes Técnicos

Chamada à API do NOWPayments:
```
POST https://api.nowpayments.io/v1/payment
Headers: x-api-key: {NOWPAYMENTS_API_KEY}
Body: {
  price_amount: amount,
  price_currency: currency_code,
  pay_currency: currency_code,
  order_id: session_code,
  order_description: "Mix session"
}
```

Resposta relevante:
```json
{
  "payment_id": 123,
  "pay_address": "bc1q...",
  "pay_amount": 0.05,
  "pay_currency": "btc"
}
```

## Sequência de execução
1. Solicitar `NOWPAYMENTS_API_KEY` ao usuário
2. Aguardar confirmação da secret
3. Atualizar e redeployar a edge function `mix-session`
4. Testar o fluxo completo

