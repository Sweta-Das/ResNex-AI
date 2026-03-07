// lib/uploadthing.ts — File upload router for reference PDFs
// Spec Module 9: Uploadthing integration for reference paper uploads

import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getAuthUser } from './auth'

const f = createUploadthing()

export const ourFileRouter = {
  // Reference PDF uploader (used in workspace for research papers)
  referencePdf: f({ pdf: { maxFileSize: '16MB', maxFileCount: 5 } })
    .middleware(async () => {
      const user = await getAuthUser()
      if (!user) throw new Error('Unauthorized')
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, name: file.name }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
