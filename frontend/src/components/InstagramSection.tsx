import { Heart, MessageCircle, Play, ExternalLink, AtSign } from "lucide-react";
import {
  INSTA_FOLLOWERS,
  INSTA_HANDLE,
  INSTA_POSTS,
  INSTA_PROFILE,
  INSTA_BIO,
  instaMediaFor,
} from "../data/instagram";

/* The restaurant's Instagram profile, mirrored on the site: profile
   header with avatar, handle, followers and bio, then a square photo
   grid exactly like the app. Real captions, likes, comments and reel
   play counts; every tile opens the live post. Tiles show the brand's
   own photography (bound in INSTA_MEDIA) and fall back to credited
   menu photography until more files are bound. */
export function InstagramSection() {
  const reels = INSTA_POSTS.filter((post) => post.kind === "reel");
  const totalPlays = reels.reduce((sum, post) => sum + (post.plays ?? 0), 0);
  return (
    <section className="home-insta" aria-labelledby="insta-title">
      <div className="home-insta__inner">
        <header className="home-insta__profile">
          <span className="home-insta__avatar">
            <img src="/images/insta/entrance-sign.jpg" alt="The illuminated Raaha Restaurant & Grill entrance sign" />
          </span>
          <div className="home-insta__id">
            <p className="home-insta__handle">
              <AtSign size={17} aria-hidden="true" focusable="false" />
              <span>{`@${INSTA_HANDLE}`}</span>
              <a className="home-insta__follow" href={INSTA_PROFILE} target="_blank" rel="noopener noreferrer">
                Follow <ExternalLink size={12} aria-hidden="true" focusable="false" />
              </a>
            </p>
            <p className="home-insta__stats">
              <span>
                <strong>{INSTA_FOLLOWERS.toLocaleString("en-IN")}</strong> followers
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong>{INSTA_POSTS.length}</strong> posts
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong>{(totalPlays / 1000).toFixed(1)}k</strong> reel plays
              </span>
            </p>
            <ul className="home-insta__bio">
              {INSTA_BIO.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </header>
        <h2 id="insta-title" className="sr-only">
          Recent posts from Raaha Restaurant &amp; Grill on Instagram
        </h2>
        <ul className="home-insta__grid">
          {INSTA_POSTS.slice(0, 9).map((post) => {
            const media = instaMediaFor(post);
            const isVideo = media.endsWith(".mp4") || media.endsWith(".webm");
            return (
              <li key={post.id}>
                <a className="home-insta__tile" href={post.url} target="_blank" rel="noopener noreferrer">
                  {isVideo ? (
                    <video src={media} muted loop playsInline autoPlay className="home-insta__img" />
                  ) : (
                    <img src={media} alt="" loading="lazy" decoding="async" className="home-insta__img" />
                  )}
                  {post.kind === "reel" && (
                    <span className="home-insta__reel">
                      <Play size={11} aria-hidden="true" focusable="false" />
                      {post.plays ? `${(post.plays / 1000).toFixed(1)}k` : ""}
                    </span>
                  )}
                  <span className="home-insta__hover">
                    <span className="home-insta__stat">
                      <Heart size={15} aria-hidden="true" focusable="false" />
                      {post.likes}
                    </span>
                    <span className="home-insta__stat">
                      <MessageCircle size={15} aria-hidden="true" focusable="false" />
                      {post.comments}
                    </span>
                  </span>
                  <span className="sr-only">
                    {`Instagram post from ${post.date}: ${post.caption} ${post.likes} likes, ${post.comments} comments${
                      post.plays ? `, ${(post.plays / 1000).toFixed(1)}k plays` : ""
                    }. Opens in a new tab.`}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <p className="home-insta__foot">
          {`Photos and reels © Raaha Restaurant & Grill — see more on `}
          <a href={INSTA_PROFILE} target="_blank" rel="noopener noreferrer">
            {`instagram.com/${INSTA_HANDLE}`}
          </a>
        </p>
      </div>
    </section>
  );
}
