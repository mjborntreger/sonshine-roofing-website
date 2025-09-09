export async function AboutVideo() {
  const VIDEO_STYLE = "aspect-video w-full border-[1px] border-[--brand-blue] rounded xl overflow-hidden shadow-lg"
  const VIDEO_SOURCE = "https://www.youtube.com/embed/Xla6_QBrJ_U"
  const VIDEO_TITLE = "About SonShine Roofing"
  const VIDEO_PLAYBACK_SETTINGS = "?autoplay=1&mute=1&loop=1&playlist=Xla6_QBrJ_U"
  return (
    <div className="mb-20">
      <iframe 
          className={VIDEO_STYLE}
          src={VIDEO_SOURCE + VIDEO_PLAYBACK_SETTINGS}
          title={VIDEO_TITLE}
          allow="autoplay; encrypted-media"
          allowFullScreen>
      </iframe>
    </div>
  )
}

