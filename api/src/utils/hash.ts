import crypto from "crypto"

export function sha256(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex")
}

export function verifyHash(candidate: string, expectedHash: string): boolean {
    const candidateHash = Buffer.from(sha256(candidate))
    const expected = Buffer.from(expectedHash)
    if (candidateHash.length !== expected.length) return false
    return crypto.timingSafeEqual(candidateHash, expected)
}
