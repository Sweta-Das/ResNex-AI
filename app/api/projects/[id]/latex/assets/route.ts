// GET /api/projects/[id]/latex/assets — list all assets
// POST /api/projects/[id]/latex/assets — create LatexAsset record (after Uploadthing upload)
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireMember(projectId: string, userId: string) {
  return prisma.projectMember.findFirst({ where: { project_id: projectId, user_id: userId } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!await requireMember(id, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const assets = await prisma.latexAsset.findMany({
    where: { projectId: id },
    orderBy: { uploadedAt: 'desc' },
  })
  return NextResponse.json(assets)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!await requireMember(id, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { fileName, fileType, url, mimeType, sizeBytes } = body

  if (!fileName || !fileType || !url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const asset = await prisma.latexAsset.create({
    data: {
      projectId: id,
      userId: user.id,
      fileName,
      fileType,
      url,
      mimeType: mimeType || '',
      sizeBytes: sizeBytes || 0,
    },
  })
  return NextResponse.json(asset, { status: 201 })
}
