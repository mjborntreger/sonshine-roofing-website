export async function BestOfTheBestVideo() {
  const VIDEO_STYLE = "aspect-video w-full border-[1px] border-slate-300 rounded xl overflow-hidden shadow-lg"
  const VIDEO_SOURCE = "https://www.youtube.com/embed/BGJSGve7Rpk"
  const VIDEO_TITLE = "SonShine Roofing - Best of the Best 2023"
  const VIDEO_PLAYBACK_SETTINGS = "?autoplay=1&mute=1&loop=1&playlist=BGJSGve7Rpk"
  return (
    <div>
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
