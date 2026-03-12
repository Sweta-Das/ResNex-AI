// app/api/projects/[id]/latex/files/[fileId]/route.ts
// PATCH: update file content or metadata
// DELETE: remove file (blocked for isMain files)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../../../lib/auth'
import { prisma } from '../../../../../../../lib/prisma'

type Params = { params: Promise<{ id: string; fileId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, fileId } = await params
  const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const file = await prisma.latexFile.findFirst({ where: { id: fileId, projectId: id } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const { content, fileName, isMain } = await req.json()

  // If renaming, check uniqueness
  if (fileName && fileName !== file.fileName) {
    const conflict = await prisma.latexFile.findUnique({
      where: { projectId_fileName: { projectId: id, fileName } },
    })
    if (conflict) {
      return NextResponse.json({ error: `A file named "${fileName}" already exists` }, { status: 409 })
    }
  }

  // If setting as main, unset current main
  if (isMain) {
    await prisma.latexFile.updateMany({
      where: { projectId: id, isMain: true, id: { not: fileId } },
      data: { isMain: false },
    })
  }

  const updated = await prisma.latexFile.update({
    where: { id: fileId },
    data: {
      ...(content !== undefined && { content }),
      ...(fileName !== undefined && { fileName }),
      ...(isMain !== undefined && { isMain }),
    },
  })

  void prisma.$executeRaw`
    INSERT INTO "ContributionEvent" ("id", "projectId", "userId", "action", "createdAt")
    VALUES (md5(random()::text || clock_timestamp()::text), ${id}, ${user.id}, 'LATEX_EDIT', NOW())
  `.catch((error) => {
    console.error('[contribution-event] latex edit insert failed:', error)
  })

  // Socket event latex_file_updated is emitted client-side after this response
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, fileId } = await params
  const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const file = await prisma.latexFile.findFirst({ where: { id: fileId, projectId: id } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  if (file.isMain) {
    return NextResponse.json({ error: 'Cannot delete the main file. Set another file as main first.' }, { status: 400 })
  }

  await prisma.latexFile.delete({ where: { id: fileId } })

  return NextResponse.json({ deleted: true })
}
