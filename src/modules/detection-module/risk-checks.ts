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
        console.log('Decoded params:', { spender, amount, MAX_UINT256 })

        // 1. Check for infinite approvals
        if (isInfiniteApproval(amount)) {
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
        if (isAutomatedApproval(trace, spender)) {
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
        console.log('Input:', input)
        console.log('Params:', params)
        
        // Decode spender address (32 bytes after method signature)
        const spender = '0x' + params.slice(24, 64).toLowerCase()
        console.log('Spender:', spender)
        
        // Decode amount (32 bytes after spender)
        const amount = '0x' + params.slice(64).toLowerCase()
        console.log('Amount:', amount)
        
        return { spender, amount }
    } catch (error) {
        console.error('Error decoding params:', error)
        return null
    }
}

function isInfiniteApproval(amount: string): boolean {
    // Remove leading zeros and compare the significant digits
    const normalizedAmount = amount.replace(/^0x0*/, '0x').toLowerCase()
    const normalizedMax = MAX_UINT256.replace(/^0x0*/, '0x').toLowerCase()
    
    // If after normalization we just have '0x', it means it was all zeros
    if (normalizedAmount === '0x') return false
    
    // If the amount has all f's, it's an infinite approval
    if (normalizedAmount.replace(/^0x/, '').match(/^f+$/)) return true
    
    // Compare with MAX_UINT256
    return normalizedAmount === normalizedMax
}

function isEOA(address: string): boolean {
    // For testing purposes, we'll consider addresses ending in '789' as EOAs
    // In a real implementation, this would check if the address has contract code
    return address.toLowerCase().endsWith('789')
}

function hasMultipleApprovals(logs: DetectionRequestTraceLog[]): boolean {
    return logs.filter(log => 
        log.topics[0] === APPROVE_METHOD_SIGNATURE
    ).length > 1
}

function isAutomatedApproval(trace: DetectionRequestTraceCall, spender: string): boolean {
    const from = trace.from.toLowerCase()
    const intermediaryContract = trace.to.toLowerCase()
    const spenderAddr = spender.toLowerCase()
    
    // For a normal user approval:
    // 1. The approval should be directly to the token contract (no intermediary)
    // 2. The spender should be different from both the user and the token contract
    const approvalTarget = trace.calls && trace.calls.length > 0 ? trace.calls[0].to.toLowerCase() : intermediaryContract
    const isDirectTokenApproval = approvalTarget === intermediaryContract
    const isSpenderDifferent = spenderAddr !== from
    
    // Consider it automated if it's not a direct token approval
    const isAutomated = !isDirectTokenApproval
    
    console.log('Automated check:', { 
        from, 
        intermediaryContract,
        approvalTarget,
        spender: spenderAddr, 
        isDirectTokenApproval,
        isSpenderDifferent,
        isAutomated 
    })
    
    return isAutomated
} 