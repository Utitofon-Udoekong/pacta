import 'reflect-metadata'
import { DetectionService } from '../src/modules/detection-module/service'
import { DetectionRequest } from '../src/modules/detection-module/dtos/requests/detect-request'

describe('DetectionService', () => {
    describe('detect', () => {
        it('should not detect risks in normal approval transaction', () => {
            const request = createMockRequest({
                trace: {
                    from: '0x123',
                    to: '0x456',
                    value: '0x0',
                    gas: '0x0',
                    gasUsed: '0x0',
                    input: '0x',
                    output: '0x',
                    pre: {},
                    post: {},
                    calls: [{
                        input: '0x095ea7b3000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000a',
                        from: '0x123',
                        to: '0x456',
                        value: '0x0',
                        gasUsed: '0x0',
                        output: '0x',
                        calls: []
                    }],
                    logs: []
                }
            })

            const response = DetectionService.detect(request)
            expect(response.detected).toBe(false)
        })

        it('should detect infinite approval', () => {
            const request = createMockRequest({
                trace: {
                    from: '0x123',
                    to: '0x456',
                    value: '0x0',
                    gas: '0x0',
                    gasUsed: '0x0',
                    input: '0x',
                    output: '0x',
                    pre: {},
                    post: {},
                    calls: [{
                        input: '0x095ea7b3000000000000000000000000123456789012345678901234567890123456789ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                        from: '0x123',
                        to: '0x456',
                        value: '0x0',
                        gasUsed: '0x0',
                        output: '0x',
                        calls: []
                    }],
                    logs: []
                }
            })

            const response = DetectionService.detect(request)
            expect(response.detected).toBe(true)
            expect(response.message).toContain('Infinite approval detected')
        })

        it('should detect batch approvals', () => {
            const request = createMockRequest({
                trace: {
                    from: '0x123',
                    to: '0x456',
                    value: '0x0',
                    gas: '0x0',
                    gasUsed: '0x0',
                    input: '0x',
                    output: '0x',
                    pre: {},
                    post: {},
                    calls: [{
                        input: '0x095ea7b3000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000a',
                        from: '0x123',
                        to: '0x456',
                        value: '0x0',
                        gasUsed: '0x0',
                        output: '0x',
                        calls: []
                    }],
                    logs: [
                        {
                            topics: ['0x095ea7b3', '0x123', '0x456'],
                            address: '0x789',
                            data: '0x',
                        },
                        {
                            topics: ['0x095ea7b3', '0x123', '0x456'],
                            address: '0x789',
                            data: '0x',
                        }
                    ]
                }
            })

            const response = DetectionService.detect(request)
            expect(response.detected).toBe(true)
            expect(response.message).toContain('Multiple token approvals')
        })

        // it('should detect automated approvals', () => {
        //     const request = createMockRequest({
        //         trace: {
        //             from: '0x123',
        //             to: '0x456',
        //             value: '0x0',
        //             gas: '0x0',
        //             gasUsed: '0x0',
        //             input: '0x',
        //             output: '0x',
        //             pre: {},
        //             post: {},
        //             calls: [{
        //                 input: '0x095ea7b3000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000a',
        //                 from: '0x123',
        //                 to: '0x789', // Different from 'from' address
        //                 value: '0x0',
        //                 gasUsed: '0x0',
        //                 output: '0x',
        //                 calls: []
        //             }],
        //             logs: []
        //         }
        //     })

        //     const response = DetectionService.detect(request)
        //     expect(response.detected).toBe(true)
        //     expect(response.message).toContain('without direct user interaction')
        // })
    })
})

function createMockRequest(overrides: Partial<DetectionRequest>): DetectionRequest {
    return {
        chainId: 1,
        hash: '0x123',
        trace: {
            from: '0x123',
            to: '0x456',
            value: '0x0',
            gas: '0x0',
            gasUsed: '0x0',
            input: '0x',
            output: '0x',
            pre: {},
            post: {},
            calls: [{
                from: '0x123',
                to: '0x456',
                value: '0x0',
                gasUsed: '0x0',
                input: '0x',
                output: '0x',
                calls: []
            }],
            logs: []
        },
        ...overrides
    } as DetectionRequest
} 