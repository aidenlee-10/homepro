import { InviteAcceptClient } from './invite-accept-client'

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  return <InviteAcceptClient token={token} />
}
