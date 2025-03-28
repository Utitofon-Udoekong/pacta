import { DetectionRequest, DetectionResponse } from './dtos'
import { analyzeApprovalRisks, ApprovalRisk } from './risk-checks'

/**
 * DetectionService
 *
 * Implements a `detect` method that receives an enriched view of an
 * EVM compatible transaction (i.e. `DetectionRequest`)
 * and returns a `DetectionResponse`
 *
 * This implementation focuses on detecting risky token approvals that could
 * expose users to asset loss or unauthorized access.
 */
export class DetectionService {
    /**
     * Analyzes a transaction for risky approval patterns
     * 
     * @param request The detection request containing transaction details
     * @returns DetectionResponse indicating if any risks were detected
     */
    public static detect(request: DetectionRequest): DetectionResponse {
        const { trace } = request
        const risks: ApprovalRisk[] = []

        // Analyze each call in the transaction trace
        if (trace.calls) {
            for (const call of trace.calls) {
                const callRisks = analyzeApprovalRisks(call, trace.logs || [])
                risks.push(...callRisks)
            }
        }

        // If any risks were detected, mark the transaction as suspicious
        const detected = risks.length > 0

        // Create a detailed message if risks were found
        const message = detected 
            ? `Detected ${risks.length} approval risk(s): ${risks.map(r => r.message).join(', ')}`
            : undefined

        return new DetectionResponse({
            request,
            detectionInfo: {
                detected,
                message,
                error: false
            }
        })
    }
}
