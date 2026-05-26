import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Clock, Calendar, Users, Heart, Church, ArrowRight, Play, BookOpen, Mail, Target, Home, Shield, Star, DollarSign, FileText, Baby, User, Mic, Music, GraduationCap, Compass, Flag, Tent, Newspaper, Megaphone, Gift, Building, Phone, Radio, Scale, Book, HelpCircle, Flame, UserCheck, Settings, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'

const PublicHome = () => {
  const [featuredAnnouncements, setFeaturedAnnouncements] = useState([])
  const [featuredPhotos, setFeaturedPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const carouselRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [announcementsResponse, photosResponse] = await Promise.all([
          fetch('/api/announcements/public?limit=3'),
          fetch('/api/gallery/photos?limit=6')
        ])
        
        const announcementsData = await announcementsResponse.json()
        const photosData = await photosResponse.json()
        
        setFeaturedAnnouncements(announcementsData.announcements || [])
        setFeaturedPhotos(photosData.photos || [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const scrollWidth = carouselRef.current.scrollWidth
        const clientWidth = carouselRef.current.clientWidth
        const maxScroll = scrollWidth - clientWidth
        
        if (carouselRef.current.scrollLeft >= maxScroll) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          carouselRef.current.scrollBy({ left: 280, behavior: 'smooth' })
        }
      }
    }, 4000) // Scroll every 4 seconds

    return () => clearInterval(interval)
  }, [])

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 280
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const serviceTimes = [
    { day: 'Sabbath School', time: '9:00 AM - 10:00 AM' },
    { day: 'Main Service', time: '10:30 AM - 12:30 PM' },
    { day: 'Afternoon Service', time: '2:30 PM - 4:00 PM' },
    { day: 'Prayer Meeting', time: 'Wednesday 6:00 PM - 7:30 PM' }
  ]

  const ministries = [
    // Leadership
    { name: 'Elders', icon: Shield, description: 'Church Elders Council - Spiritual leadership' },
    { name: 'Deaconry', icon: Star, description: 'Deacons and Deaconesses - Service ministry' },
    { name: 'Treasurer', icon: DollarSign, description: 'Church Financial Management' },
    { name: 'Church Clerk', icon: FileText, description: 'Church Records and Administration' },

    // Ministries
    { name: 'Youth Ministry', icon: Target, description: 'Engaging programs for young adults and youth - I Will Go' },
    { name: 'Children Ministry', icon: Baby, description: 'Children Programs and Education' },
    { name: 'Adventist Men Ministry', icon: User, description: 'Men Ministry Programs' },
    { name: 'Adventist Women Ministry', icon: Heart, description: 'Women Ministry Programs' },
    { name: 'Adventist Possibility Ministry', icon: HelpCircle, description: 'Possibility Ministry Programs' },
    { name: 'Health Ministries', icon: Heart, description: 'Health education and community wellness' },
    { name: 'Family Life', icon: Home, description: 'Strengthening families through faith' },

    // Music and Worship
    { name: 'Music Ministry', icon: Music, description: 'Church Music and Choir coordination' },
    { name: 'Choristers', icon: Mic, description: 'Church Choir' },
    { name: 'Church Choir', icon: Music, description: 'Main Church Choir' },
    { name: 'Pianist', icon: Music, description: 'Piano and Keyboard ministry' },
    { name: 'PA System', icon: Settings, description: 'Sound and Audio ministry' },

    // Education
    { name: 'Sabbath School', icon: BookOpen, description: 'Bible study and spiritual growth for all ages' },
    { name: 'Education', icon: GraduationCap, description: 'Church Education Programs' },
    { name: 'V.O.P./S.O.P.', icon: Radio, description: 'Voice of Prophecy/School of Prophets' },

    // Youth Programs
    { name: 'Adventurer Club', icon: Compass, description: 'Adventurer Programs for younger children' },
    { name: 'Ambassadors', icon: Flag, description: 'Ambassador Programs for youth' },
    { name: 'Pathfinder', icon: Compass, description: 'Pathfinder Programs' },
    { name: 'VBS', icon: Tent, description: 'Vacation Bible School' },

    // Support Ministries
    { name: 'Dorcas', icon: HelpCircle, description: 'Dorcas Ministry - Community service' },
    { name: 'Personal Ministry', icon: Megaphone, description: 'Personal Evangelism' },
    { name: 'Publishing', icon: Newspaper, description: 'Publishing and Literature ministry' },
    { name: 'Evangelism', icon: Megaphone, description: 'Evangelism Programs' },
    { name: 'Stewardship', icon: DollarSign, description: 'Stewardship Programs' },

    // Special Programs
    { name: 'Camp Meeting', icon: Tent, description: 'Camp Meeting Organization' },
    { name: 'Development', icon: Building, description: 'Church Development Projects' },
    { name: 'Welfare', icon: HelpCircle, description: 'Church Welfare Programs' },
    { name: 'Interest Coordinator', icon: Phone, description: 'New Member Interests' },

    // Communication
    { name: 'Communication Secretary', icon: Megaphone, description: 'Church Communications' },

    // Other Ministries
    { name: 'Prayer Ministry', icon: Flame, description: 'Prayer Programs' },
    { name: 'Religious Liberty', icon: Scale, description: 'Religious Liberty Programs' },
    { name: 'Nurture and Retention', icon: UserCheck, description: 'Member Nurturing' },
    { name: 'Library', icon: Book, description: 'Church Library' },
    { name: 'School Chair', icon: GraduationCap, description: 'Church School Management' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="church-gradient text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6 animate-fade-in">
              <img src="/logo.png" alt="SDA Church Logo" className="w-32 h-32 md:w-48 md:h-48 object-contain" />
              <h1 className="text-center">
                <span className="text-2xl md:text-4xl font-light block">Welcome to</span>
                <span className="text-3xl md:text-5xl font-medium block">Seventh day Adventist</span>
                <span className="text-4xl md:text-6xl font-bold block">Kiserian Main</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 text-center">
              Join us for worship, fellowship, and spiritual growth
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/announcements"
                className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100"
              >
                View Announcements
              </Link>
              <Link
                to="/auth/login"
                className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-primary-600"
              >
                Member Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service Times */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Service Times
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceTimes.map((service, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-4 text-primary-600" />
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                  {service.day}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{service.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Announcements */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Latest Announcements
            </h2>
            <Link
              to="/announcements"
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="loading-spinner mx-auto"></div>
            </div>
          ) : featuredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredAnnouncements.map((announcement) => (
                <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`badge ${
                      announcement.priority === 'urgent' ? 'badge-error' :
                      announcement.priority === 'high' ? 'badge-warning' :
                      announcement.priority === 'low' ? 'badge-secondary' :
                      'badge-primary'
                    }`}>
                      {announcement.priority}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {announcement.content}
                  </p>
                  <Link
                    to={`/announcements/${announcement.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Read more →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No announcements available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Photos */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Photo Gallery
            </h2>
            <Link
              to="/gallery"
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <span>View Full Gallery</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow aspect-square"
                >
                  <img
                    src={`https://api.telegram.org/file/bot${import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''}/${photo.telegram_file_id}`}
                    alt={photo.caption || 'Photo'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x400?text=Photo'
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all">
                    <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-medium truncate">{photo.caption || 'Photo'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No photos available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Ministries */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Our Ministries
          </h2>
          <div className="relative">
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              style={{ transform: 'translateY(-50%)' }}
            >
              <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </button>
            <div
              ref={carouselRef}
              className="flex flex-row overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide"
            >
              {ministries.map((ministry, index) => {
                const Icon = ministry.icon
                return (
                  <div key={index} className="flex-shrink-0 w-64 text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-lg transition-shadow snap-start">
                    <Icon className="h-12 w-12 mx-auto mb-4 text-primary-600" />
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                      {ministry.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {ministry.description}
                    </p>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              style={{ transform: 'translateY(-50%)' }}
            >
              <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </div>
      </section>

      {/* Live Stream Section */}
      <section id="live-stream" className="py-16 church-gradient text-white scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Join Our Live Stream</h2>
            <p className="text-xl mb-8 text-blue-100">
              Can't make it to church? Join us online for our live services
            </p>
            <Link
              to="/#live-stream"
              className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100 flex items-center space-x-2 mx-auto w-fit"
            >
              <Play className="h-5 w-5" />
              <span>Watch Live</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary-600" />
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Stay Connected
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Subscribe to our newsletter to receive weekly updates and announcements
            </p>
            <form
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault()
                toast.info('Newsletter signup is not connected yet. Please contact the church office to subscribe.')
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="input flex-1"
                required
              />
              <button type="submit" className="btn btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PublicHome
