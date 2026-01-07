# TODO: Implement Oxapay Transactions Without ACROS

## Tasks
- [x] Update deposit route to use Oxapay invoice API
- [x] Update withdrawal route to use Oxapay payout API
- [x] Ensure webhook handles both deposit and withdrawal callbacks
- [x] Test transaction flows

## Improvements Made
- [x] Fix API key names to match Oxapay documentation (merchant_api_key for deposits, payout_api_key for withdrawals)
- [x] Add comprehensive input validation (amount limits, address format, network validation)
- [x] Implement transaction logging with Winston
- [x] Add rate limiting middleware (express-rate-limit)
- [x] Make balance updates atomic with MongoDB transactions
- [x] Add duplicate webhook prevention
- [x] Enhance error handling and responses
