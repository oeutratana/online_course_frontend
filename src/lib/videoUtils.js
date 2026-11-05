const fallbackPreviewVideoUrl = ''

export const getEmbedVideoUrl = (url) => {
  if (!url) return fallbackPreviewVideoUrl

  if (url.includes('youtube.com/embed/')) {
    return `${url}${url.includes('?') ? '&' : '?'}autoplay=1&rel=0`
  }

  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v')
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : fallbackPreviewVideoUrl
  }

  if (url.includes('youtube.com/shorts/')) {
    return `https://www.youtube-nocookie.com/embed/${url.split('/shorts/')[1].split('?')[0]}?autoplay=1&rel=0`
  }

  if (url.includes('youtu.be/')) {
    return `https://www.youtube-nocookie.com/embed/${url.split('youtu.be/')[1].split('?')[0]}?autoplay=1&rel=0`
  }

  return url
}

export const isVideoFile = (url) => /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url)