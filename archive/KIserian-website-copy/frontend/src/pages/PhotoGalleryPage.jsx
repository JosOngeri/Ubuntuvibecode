import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, ArrowRight } from 'lucide-react'
import Card from '../components/common/Card'
import PhotoGallery from '../components/gallery/PhotoGallery'
import { useToast } from '../contexts/ToastContext'

const PhotoGalleryPage = () => {
  const toast = useToast()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchPhotos()
  }, [page])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/gallery/photos?page=${page}&limit=20`)
      const data = await response.json()
      setPhotos(data.photos || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch photos:', error)
      toast.error('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (photoId) => {
    setPhotos(photos.filter(photo => photo.id !== photoId))
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="church-gradient text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Megaphone className="h-16 w-16 mx-auto mb-6 text-blue-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Photo Gallery
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Browse photos from our church events, sermons, and activities
            </p>
            <Link
              to="/auth/login"
              className="inline-flex items-center space-x-2 bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium"
            >
              <span>Join Our Community</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <Card className="p-6">
            <PhotoGallery
              photos={photos}
              loading={loading}
              onDelete={handleDelete}
              canUpload={false}
              showUploadButton={false}
              showViewToggle={true}
              showSearch={true}
            />
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default PhotoGalleryPage
