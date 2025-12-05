import video1 from "@/assets/video-depoimento-1.mp4";
import video2 from "@/assets/video-depoimento-2.mp4";

const VideoTestimonials = () => {
  const videos = [
    {
      id: 1,
      src: video1,
    },
    {
      id: 2,
      src: video2,
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Vídeos
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Veja nossos <span className="text-gradient">produtos em ação</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Confira a qualidade e o acabamento das nossas tags personalizadas
          </p>
        </div>

        {/* Videos Grid */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-4xl mx-auto">
          {videos.map((video) => (
            <div
              key={video.id}
              className="relative w-full max-w-[350px] rounded-2xl bg-card border-2 border-brand-primary/20 shadow-brand-lg overflow-hidden"
            >
              {/* Decorative frame */}
              <div className="absolute inset-0 rounded-2xl border-4 border-brand-primary/10 pointer-events-none z-10" />
              
              {/* Video Player */}
              <video
                src={video.src}
                className="w-full h-auto"
                autoPlay
                loop
                muted
                playsInline
                title={`Vídeo depoimento ${video.id}`}
              />
            </div>
          ))}
        </div>

        {/* Note about videos */}
        <p className="text-center text-muted-foreground text-sm mt-8 font-body">
          Vídeos em reprodução automática
        </p>
      </div>
    </section>
  );
};

export default VideoTestimonials;
