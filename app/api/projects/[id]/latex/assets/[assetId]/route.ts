// DELETE /api/projects/[id]/latex/assets/[assetId]
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, assetId } = await params

  const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const asset = await prisma.latexAsset.findFirst({ where: { id: assetId, projectId: id } })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only the uploader or admin can delete
  if (asset.userId !== user.id && member.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.latexAsset.delete({ where: { id: assetId } })
  return NextResponse.json({ success: true })
}
