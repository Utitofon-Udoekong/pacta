![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![Yarn](https://img.shields.io/badge/yarn-%232C8EBB.svg?style=for-the-badge&logo=yarn&logoColor=white)

# Venn Approval Risk Detector

A custom detector for the Venn Network that identifies risky token approvals that could expose users to asset loss or unauthorized access.

## Overview

This detector analyzes EVM transactions to identify potentially dangerous token approvals. It focuses on several key risk patterns:

1. **Infinite Approvals**: Detects when users grant unlimited token transfer permissions
2. **EOA Approvals**: Identifies approvals granted to externally owned accounts instead of contracts
3. **Batch Approvals**: Flags multiple token approvals in a single transaction
4. **Automated Approvals**: Detects approvals that occur without direct user interaction

## Risk Types

### High Severity
- **Infinite Approvals**: When a user approves the maximum possible amount (`uint256.max`), allowing unlimited token transfers
- **EOA Approvals**: When tokens are approved to be spent by an externally owned account (EOA) instead of a smart contract

### Medium Severity
- **Batch Approvals**: Multiple token approvals detected in the same transaction
- **Automated Approvals**: Approvals that occur without direct user interaction, potentially indicating automated/malicious behavior

## Example Transactions

### Infinite Approval
```json
{
  "input": "0x095ea7b3000000000000000000000000...",
  "value": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
}
```

### Batch Approval
```json
{
  "logs": [
    {
      "topics": ["0x095ea7b3...", "0x...", "0x..."]
    },
    {
      "topics": ["0x095ea7b3...", "0x...", "0x..."]
    }
  ]
}
```

## Implementation Details

The detector is implemented in TypeScript and uses the Venn Custom Detector API. Key components:

- `DetectionService`: Main service that processes transactions
- `risk-checks.ts`: Contains the logic for identifying different types of approval risks
- `dtos/`: Contains the request and response type definitions

## Testing

The detector can be tested using the Venn Security Sandbox. Example test cases:

1. Normal approval transaction (should not trigger)
2. Infinite approval transaction (should trigger)
3. Batch approval transaction (should trigger)
4. EOA approval transaction (should trigger)

## Development

1. Clone the repository
2. Install dependencies: `yarn install`
3. Run in development mode: `yarn dev`
4. The detector will be available at `http://localhost:3000`

## Deployment

Build and deploy using Docker:

```bash
docker build -f Dockerfile . -t venn-approval-detector
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# Venn Custom Detector boilerplate
A boilerplate for getting started with Venn as a Security Provider. Use is as a starting point to build your own custom detectors on Venn Network.

> 📚 [What is Venn?](https://docs.venn.build/)

## Table of Contents
- [Introduction](#venn-custom-detector-boilerplate)
- [Quick Start](#quick-start)
- [What's inside?](#-whats-inside)
- [Local development:](#️-local-development)
- [Deploy to production](#-deploy-to-production)

## ✨ Quick start
1. Clone or fork this repo and install dependencies using `yarn install` _(or `npm install`)_
2. Find the detection service under: `src/modules/detection-module/service.ts`

    ```ts
    import { DetectionResponse, DetectionRequest } from './dtos'

    /**
     * DetectionService
     *
     * Implements a `detect` method that receives an enriched view of an
     * EVM compatible transaction (i.e. `DetectionRequest`)
     * and returns a `DetectionResponse`
     *
     * API Reference:
     * https://github.com/ironblocks/venn-custom-detection/blob/master/docs/requests-responses.docs.md
     */
    export class DetectionService {
        /**
         * Update this implementation code to insepct the `DetectionRequest`
         * based on your custom business logic
         */
        public static detect(request: DetectionRequest): DetectionResponse {
            
            /**
             * For this "Hello World" style boilerplate
             * we're mocking detection results using
             * some random value
             */
            const detectionResult = Math.random() < 0.5;


            /**
             * Wrap our response in a `DetectionResponse` object
             */
            return new DetectionResponse({
                request,
                detectionInfo: {
                    detected: detectionResult,
                },
            });
        }
    }
    ```

3. Implement your own logic in the `detect` method
4. Run `yarn dev` _(or `npm run dev`)_
5. That's it! Your custom detector service is now ready to inspect transaction

## 📦 What's inside?
This boilerplate is built using `Express.js`, and written in `TypeScript` using `NodeJS`.  
You can use it as-is by adding your own security logic to it, or as a reference point when using a different programming language.

**Notes on the API**
1. Your detector will get a `DetectionRequest`, and is expected to respond with a `DetectionResponse`

See our [API Reference](https://github.com/ironblocks/venn-custom-detection/blob/master/docs/requests-responses.docs.md) for more information.

## 🛠️ Local Development

**Environment Setup**

Create a `.env` file with:

```bash
PORT=3000
HOST=localhost
LOG_LEVEL=debug
```

**Runing In Dev Mode**
```bash
yarn        # or npm install
yarn dev    # or npm run dev
```

## 🚀 Deploy To Production

**Manual Build**

```bash
yarn build      # or npm run build
yarn start      # or npm run start
```


**Using Docker**
```bash
docker build -f Dockerfile . -t my-custom-detector
```

