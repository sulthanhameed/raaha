import { Heart, MessageCircle, Play, ExternalLink, Camera } from "lucide-react";
import {
  INSTA_FOLLOWERS,
  INSTA_HANDLE,
  INSTA_POSTS,
  INSTA_PROFILE,
  instaMediaFor,
} from "../data/instagram";

/* The restaurant's own Instagram feed: real captions, likes and play
   counts with links to each post. Tiles show the matching Instagram
   file once the owner uploads it into public/media/insta/ and binds it
   in INSTA_MEDIA; until then each tile wears a representative photo
   from the credited menu photography. */
export function InstagramSection() {
  return (
    <section className="home-insta" aria-labelledby="insta-title">
      <div className="home-insta__inner">
        <header className="home-insta__head">
          <p className="home-insta__eyebrow">
            <Camera size={14} aria-hidden="true" focusable="false" />
            {`@${INSTA_HANDLE} · ${INSTA_FOLLOWERS.toLocaleString("en-IN")} followers`}
          </p>
          <h2 id="insta-title" className="home-insta__title">
            From our <em>Instagram</em>
          </h2>
          <p className="home-insta__copy">
            Daily plates, mandi mornings and shawarma spits — straight from the Raaha
            kitchen feed. Tap any tile to watch or read the post on Instagram.
          </p>
          <a className="home-insta__follow" href={INSTA_PROFILE} target="_blank" rel="noopener noreferrer">
            Follow @raaharestaurant <ExternalLink size={14} aria-hidden="true" focusable="false" />
          </a>
        </header>
        <ul className="home-insta__grid" aria-label="Recent posts from Raaha Restaurant on Instagram">
          {INSTA_POSTS.slice(0, 8).map((post) => {
            const media = instaMediaFor(post);
            const isVideo = media.endsWith(".mp4") || media.endsWith(".webm");
            return (
              <li key={post.id}>
                <a
                  className="home-insta__tile"
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="home-insta__media">
                    {isVideo ? (
                      <video src={media} muted loop playsInline autoPlay className="home-insta__img" />
                    ) : (
                      <img src={media} alt="" loading="lazy" decoding="async" className="home-insta__img" />
                    )}
                    {post.kind === "reel" && (
                      <span className="home-insta__badge">
                        <Play size={11} aria-hidden="true" focusable="false" />
                        {post.plays ? `${(post.plays / 1000).toFixed(1)}k plays` : "Reel"}
                      </span>
                    )}
                  </span>
                  <span className="home-insta__body">
                    <span className="home-insta__caption">{post.caption}</span>
                    <span className="home-insta__meta">
                      <span className="home-insta__stat">
                        <Heart size={12} aria-hidden="true" focusable="false" />
                        {post.likes}
                      </span>
                      <span className="home-insta__stat">
                        <MessageCircle size={12} aria-hidden="true" focusable="false" />
                        {post.comments}
                      </span>
                      <span className="home-insta__date">{post.date}</span>
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
