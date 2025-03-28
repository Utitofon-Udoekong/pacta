import { DetectionRequestTraceCall, DetectionRequestTraceLog } from './dtos/requests/detect-request'

// Constants for risk detection
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
const APPROVE_METHOD_SIGNATURE = '0x095ea7b3' // approve(address,uint256)

export interface ApprovalRisk {
    type: 'INFINITE_APPROVAL' | 'UNVERIFIED_CONTRACT' | 'EOA_APPROVAL' | 'FRONTRUNNING_PATTERN' | 'BATCH_APPROVAL' | 'AUTOMATED_APPROVAL'
    message: string
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
    evidence: {
        from: string
        to: string
        value?: string
        method?: string
        timestamp?: number
    }
}

export function analyzeApprovalRisks(trace: DetectionRequestTraceCall, logs: DetectionRequestTraceLog[]): ApprovalRisk[] {
    const risks: ApprovalRisk[] = []
    
    // Check if this is an approval call
    if (trace.input.startsWith(APPROVE_METHOD_SIGNATURE)) {
        // Extract approval parameters
        const params = decodeApprovalParams(trace.input)
        if (!params) return risks

        const { spender, amount } = params

        // 1. Check for infinite approvals
        if (amount === MAX_UINT256) {
            risks.push({
                type: 'INFINITE_APPROVAL',
                message: 'Infinite approval detected - this allows unlimited token transfers',
                severity: 'HIGH',
                evidence: {
                    from: trace.from,
                    to: spender,
                    value: amount
                }
            })
        }

        // 2. Check for EOA approvals
        if (isEOA(spender)) {
            risks.push({
                type: 'EOA_APPROVAL',
                message: 'Approval granted to an EOA instead of a contract',
                severity: 'HIGH',
                evidence: {
                    from: trace.from,
                    to: spender,
                    value: amount
                }
            })
        }

        // 3. Check for batch approvals
        if (hasMultipleApprovals(logs)) {
            risks.push({
                type: 'BATCH_APPROVAL',
                message: 'Multiple token approvals detected in the same transaction',
                severity: 'MEDIUM',
                evidence: {
                    from: trace.from,
                    to: spender,
                    value: amount
                }
            })
        }

        // 4. Check for automated approvals (no user interaction)
        if (isAutomatedApproval(trace, logs)) {
            risks.push({
                type: 'AUTOMATED_APPROVAL',
                message: 'Approval detected without direct user interaction',
                severity: 'MEDIUM',
                evidence: {
                    from: trace.from,
                    to: spender,
                    value: amount
                }
            })
        }
    }

    return risks
}

function decodeApprovalParams(input: string): { spender: string; amount: string } | null {
    try {
        // Remove method signature
        const params = input.slice(10)
        // Decode spender address (32 bytes after method signature)
        const spender = '0x' + params.slice(24, 64)
        // Decode amount (32 bytes after spender)
        const amount = '0x' + params.slice(64, 128)
        return { spender, amount }
    } catch {
        return null
    }
}

function isEOA(address: string): boolean {
    // In a real implementation, this would check if the address has contract code
    // For now, we'll use a simple heuristic: if the address is not in the trace's pre/post states
    return true // Placeholder - should be implemented with actual contract code check
}

function hasMultipleApprovals(logs: DetectionRequestTraceLog[]): boolean {
    return logs.filter(log => 
        log.topics[0] === APPROVE_METHOD_SIGNATURE
    ).length > 1
}

function isAutomatedApproval(trace: DetectionRequestTraceCall, logs: DetectionRequestTraceLog[]): boolean {
    // Check if this approval was triggered by another contract call
    // rather than direct user interaction
    return trace.from !== trace.to
} 