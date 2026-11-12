import { CKEditor } from '@ckeditor/ckeditor5-react'
import {
  AutoImage,
  AutoLink,
  Autoformat,
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  FileRepository,
  Heading,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  Italic,
  Link,
  List,
  Paragraph,
  PasteFromOffice,
  Table,
  TableToolbar,
  TextTransformation,
  Underline,
  type Editor,
  type FileLoader,
  type UploadAdapter,
} from 'ckeditor5'
import translations from 'ckeditor5/translations/vi.js'
import 'ckeditor5/ckeditor5.css'
import { uploadService } from '@/services'

export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Thư mục Cloudinary cho ảnh chèn vào bài */
  uploadFolder?: string
  minHeight?: number
}

/** Đẩy ảnh dán/kéo thả trong editor lên Cloudinary qua BE (`POST /upload/image`) */
class CloudinaryUploadAdapter implements UploadAdapter {
  constructor(private loader: FileLoader, private folder: string) {}
  async upload() {
    const file = await this.loader.file
    if (!file) throw new Error('Không đọc được tệp ảnh')
    const res = await uploadService.uploadImage(file, this.folder)
    const url = res.result?.url
    if (!url) throw new Error(res.message || 'Tải ảnh thất bại')
    return { default: url }
  }
  abort() {}
}

/** Trình soạn thảo bài viết (CKEditor 5, bản GPL), xuất HTML */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Viết bài giới thiệu…',
  uploadFolder = 'campaigns',
  minHeight = 220,
}: RichTextEditorProps) {
  return (
    <div className="capnong-ck rounded-xl text-sm font-normal" style={{ ['--ck-min-h' as string]: `${minHeight}px` }}>
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          licenseKey: 'GPL',
          language: 'vi',
          translations: [translations],
          placeholder,
          plugins: [
            Essentials, Paragraph, Heading, Bold, Italic, Underline, Link, AutoLink, List, Indent, BlockQuote,
            Autoformat, TextTransformation, PasteFromOffice, Table, TableToolbar,
            Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageUpload, ImageInsert, AutoImage, FileRepository,
          ],
          toolbar: {
            items: [
              'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'underline', 'link', '|',
              'bulletedList', 'numberedList', 'outdent', 'indent', '|', 'blockQuote', 'insertImage', 'insertTable',
            ],
            shouldNotGroupWhenFull: false,
          },
          heading: {
            options: [
              { model: 'paragraph', title: 'Đoạn văn', class: 'ck-heading_paragraph' },
              { model: 'heading2', view: 'h2', title: 'Tiêu đề lớn', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Tiêu đề nhỏ', class: 'ck-heading_heading3' },
            ],
          },
          image: {
            toolbar: ['imageTextAlternative', 'toggleImageCaption', '|', 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side'],
          },
          table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
          link: { addTargetToExternalLinks: true, defaultProtocol: 'https://' },
        }}
        onReady={(editor: Editor) => {
          editor.plugins.get(FileRepository).createUploadAdapter = (loader) =>
            new CloudinaryUploadAdapter(loader, uploadFolder)
        }}
        onChange={(_, editor) => onChange(editor.getData())}
      />
    </div>
  )
}
