const VideoTestimonials = () => {
  const videos = [
    {
      id: 1,
      embedUrl: "https://www.instagram.com/reel/DR2GAGGjlxP/embed/?hidecaption=true&autoplay=false",
    },
    {
      id: 2,
      embedUrl: "https://www.instagram.com/reel/DR2KIwIkdM0/embed/?hidecaption=true&autoplay=false",
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
              className="relative w-full max-w-[350px] rounded-2xl overflow-hidden bg-card border-2 border-brand-primary/20 shadow-brand-lg"
              style={{ height: '620px' }}
            >
              {/* Decorative frame */}
              <div className="absolute inset-0 rounded-2xl border-4 border-brand-primary/10 pointer-events-none z-10" />
              
              {/* Instagram Embed - with overflow hidden to crop bottom */}
              <div className="w-full h-full overflow-hidden">
                <iframe
                  src={video.embedUrl}
                  className="w-full"
                  style={{ height: '750px', marginBottom: '-130px' }}
                  frameBorder="0"
                  scrolling="no"
                  allowTransparency={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  title={`Vídeo depoimento ${video.id}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoTestimonials;
