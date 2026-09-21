import { auth } from '@/auth'

/** Is there a signed-in session on this request?
 *
 * Server Actions are public POST endpoints: the id is in the client bundle
 * and a crafted request reaches the function body directly, so the
 * middleware is not their authorization boundary — it can be bypassed
 * outright (Next has shipped middleware-bypass CVEs) and it is the wrong
 * layer besides. Every action asks here first.
 *
 * Fails closed: if the session lookup throws, the caller is not signed in.
 */
export async function isSignedIn(): Promise<boolean> {
  try {
    const session = await auth()
    return Boolean(session?.user)
  } catch {
    return false
  }
}
