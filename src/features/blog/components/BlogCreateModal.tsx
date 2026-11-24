import React from 'react'
import { BlogEditorModal } from './BlogEditorModal'

interface BlogCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (msg: string) => void
}

export const BlogCreateModal: React.FC<BlogCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  return (
    <BlogEditorModal
      isOpen={isOpen}
      onClose={onClose}
      editingBlog={null}
      onSuccess={onSuccess}
    />
  )
}
