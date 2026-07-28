import React from "react";
import {
  AbsoluteFill,
  Composition,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ---------------- timeline (30fps) ----------------
   realistic LinkedIn flow, per References for Gif/:
   0–55    thread with the sent slop message
   55      hover: message row greys, reaction bar pops up
   80      click ⋯
   84      menu pops (Forward / Share via email / Delete / Edit)
   104–118 cursor to Delete, click
   122     message vanishes, popups close
   140     the driftwood message lands in the thread
   152     "driftwood built this demo" note pops
   202–262 "CTO is typing" (2s), then the reply
   292     "call booked" divider
   →360    hold, loop

   The compose beat (click the field, caret, paste, Send) was cut 2026-07-28:
   the card is masked at its foot on the site, so the compose line — and the
   whole typing performance in it — sat in the cropped-off region. The
   message simply lands after the delete now. Don't reinstate it without
   checking `.hero-card .gif-shell`'s mask first.
--------------------------------------------------- */
const T = {
  callout: 12,
  hoverStart: 30,
  hover: 55,
  dots: 80,
  menu: 84,
  del: 104,
  delPress: 118,
  gone: 122,
  sent: 140,
  note: 152,
  typing: 202,
  reply: 262,
  win: 292,
  end: 360,
};

/* blurred stand-in for the grey redaction bars — invented names, made
   illegible by the blur */
const Blur: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="redact-blur" aria-hidden="true">
    {children}
  </span>
);

const Cursor: React.FC<{ x: number; y: number; pressed: boolean; opacity: number }> = ({
  x,
  y,
  pressed,
  opacity,
}) => (
  <svg
    className="cursor"
    viewBox="0 0 20 24"
    style={{
      left: x,
      top: y,
      opacity,
      transform: `scale(${pressed ? 0.88 : 1})`,
      transformOrigin: "4px 2px",
    }}
  >
    <path
      d="M4 1 L4 19.5 L8.6 15.4 L11.4 22.2 L14.6 20.8 L11.8 14.2 L17.8 14.2 Z"
      fill="#111"
      stroke="#fff"
      strokeWidth="1.4"
    />
  </svg>
);

/* piecewise cursor path. The ⋯ and Delete stops are measured off a render of
   the real popups (scene coordinates, minus the arrow's ~3px tip offset) —
   they used to be guesses, and the pointer clicked empty space next to the
   menu instead of the row it was deleting. Re-measure if the popups move. */
const KF: Array<[number, number, number]> = [
  [0, 520, 360],
  [T.hoverStart, 500, 330],
  [T.hover, 300, 190],
  [T.dots, 449, 237], // the ⋯ at the right end of the reaction bar
  [T.menu + 2, 449, 237],
  [T.del, 345, 168], // the Delete row in the menu it just opened
  [T.gone, 345, 171],
  [T.gone + 26, 300, 300], // drifts off as it fades
];

export const CompareScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cursorX = interpolate(frame, KF.map((k) => k[0]), KF.map((k) => k[1]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorY = interpolate(frame, KF.map((k) => k[0]), KF.map((k) => k[2]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // the pointer's work ends with the delete; it fades out rather than
  // carrying on to a compose line the site's mask crops away
  const cursorOpacity = interpolate(
    frame,
    [T.hoverStart, T.hoverStart + 6, T.gone + 4, T.gone + 22],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const pressed =
    (frame >= T.dots && frame < T.dots + 5) ||
    (frame >= T.delPress - 4 && frame < T.gone);

  const hovered = frame >= T.hover && frame < T.gone;
  const menuOpen = frame >= T.menu && frame < T.gone;
  const slopGone = frame >= T.gone;
  const delHot = frame >= T.del - 4 && frame < T.gone;

  const calloutIn = spring({ frame: frame - T.callout, fps, config: { damping: 13, mass: 0.6 } });
  const calloutOut = interpolate(frame, [T.menu - 6, T.menu], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const barIn = spring({ frame: frame - T.hover, fps, config: { damping: 15, mass: 0.5 } });
  const menuIn = spring({ frame: frame - T.menu, fps, config: { damping: 15, mass: 0.5 } });

  const sentIn = spring({ frame: frame - T.sent, fps, config: { damping: 200 }, durationInFrames: 7 });
  const noteIn = spring({ frame: frame - T.note, fps, config: { damping: 12, mass: 0.6 } });
  const replySpring = spring({ frame: frame - T.reply, fps, config: { damping: 14, mass: 0.7 } });
  const replyDividerIn = interpolate(frame, [T.typing - 8, T.typing], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const typingOn = frame >= T.typing && frame < T.reply;
  const typingIn = spring({ frame: frame - T.typing, fps, config: { damping: 15, mass: 0.6 } });
  const dot = (i: number) =>
    0.35 + 0.65 * (0.5 + 0.5 * Math.sin((frame - T.typing) * 0.32 - i * 1.1));
  const winIn = spring({ frame: frame - T.win, fps, config: { damping: 16, mass: 0.6 } });

  return (
    <AbsoluteFill className="scene" style={{ background: "#fff" }}>
      <div className="card">
        <div className="thread-inner">
          <div className="li-head">
            <span className="li-name">
              CTO @ series C startup
            </span>
            <span className="li-presence" />
            <span className="li-icons">⋯&nbsp;&nbsp;⤢&nbsp;&nbsp;✕</span>
          </div>

          <div className="li-body" style={{ position: "relative" }}>
            <div className="divider">
              <hr />
              <span>Jul 9</span>
              <hr />
            </div>

            {/* the thesis, called out before the delete */}
            {frame >= T.callout && frame < T.menu && (
              <div
                className="callout"
                style={{
                  opacity: calloutIn * calloutOut,
                  transform: `scale(${0.82 + 0.18 * calloutIn})`,
                  transformOrigin: "top left",
                }}
              >
                AI slop doesn't get responses
              </div>
            )}
            {/* hover: grey band behind the body text only, per
                pop reference image.png — full bleed, name row stays white */}
            {hovered && !slopGone && <div className="hover-band" style={{ top: 57, height: 114 }} />}
            {/* the bar tucks under the message's grey band with a hair of gap,
                as in pop reference image.png — it used to float 22px clear */}
            {hovered && !slopGone && (
              <span className="seen-solid" style={{ top: 152 }}>
                <svg viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="8" fill="#191919" />
                  <path d="M4.6 8.3l2.2 2.2 4.6-4.7" fill="none" stroke="#fff" strokeWidth="1.6" />
                </svg>
              </span>
            )}
            {/* the sent slop message */}
            {!slopGone && (
              <div className="msg" style={{ position: "relative" }}>
                <span className="avatar">
                  <Img src={staticFile("yuvan.webp")} />
                </span>
                <div>
                  <div className="msg-head">
                    <span className="who">Yuvan Sundrani</span>
                    <span className="when">· 6:40 PM</span>
                  </div>
                  <p className="msg-body">
                    Hey CTO, hope you're doing well! I'm with an AI-powered QA
                    platform, the <b>all-in-one way to ship faster with confidence</b>. Teams
                    like yours are seeing <b>huge results</b> — we'd love to show you how. Any
                    chance you have 15 minutes this week? You can{" "}
                    <span className="fake-link">grab time here</span>.
                  </p>
                </div>
              </div>
            )}

            {/* hover reaction bar (pop up.png) */}
            {hovered && (
              <div
                className="react-bar"
                style={{
                  right: 10,
                  // flush under the grey band with a 2px gap, as measured off
                  // pop reference image.png — it used to float 22px clear
                  top: 173,
                  opacity: barIn,
                  transform: `scale(${0.9 + 0.1 * barIn})`,
                  transformOrigin: "bottom center",
                }}
              >
                <span>👏</span>
                <span>👍</span>
                <span>😊</span>
                {/* icons are #494949 (sampled off the reference — the darkest
                    ink in that bar is 73,73,73, not black) and drawn heavier
                    than before: at 14px the old hairline strokes dissolved */}
                <span className="rb-icon">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <circle cx="11" cy="12.5" r="7.6" fill="none" stroke="#494949" strokeWidth="1.9" />
                    <circle cx="8.3" cy="10.8" r="1.15" fill="#494949" />
                    <circle cx="13.7" cy="10.8" r="1.15" fill="#494949" />
                    <path d="M7.7 14.8c0.85 1.6 2.05 2.35 3.3 2.35s2.45-0.75 3.3-2.35" fill="none" stroke="#494949" strokeWidth="1.7" strokeLinecap="round" />
                    <path d="M18.8 3.6v5.2 M16.2 6.2h5.2" stroke="#494949" strokeWidth="1.9" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="rb-icon">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M9.6 4.6 L3.4 10.9 L9.6 17.2 M3.4 10.9 H13.6 C17.8 10.9 20.4 13.6 20.4 18" fill="none" stroke="#494949" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {/* the ⋯ menu hangs off the ⋯ itself (pop up 2.png), not off
                    the card — it opens upward and to the left, over the message,
                    with its foot on the button that summoned it. Anchoring it
                    here is also what lets the cursor path be trusted: the menu
                    can't drift away from the thing the pointer clicked. */}
                <span className="rb-dots">
                  {/* three round dots, drawn — the ⋯ glyph rendered as three
                      thin specks nothing like the reference's solid dots
                      (2.7px across on a 7px pitch) */}
                  <svg viewBox="0 0 17 4" width="17" height="4">
                    <circle cx="1.35" cy="2" r="1.35" fill="#494949" />
                    <circle cx="8.5" cy="2" r="1.35" fill="#494949" />
                    <circle cx="15.65" cy="2" r="1.35" fill="#494949" />
                  </svg>
                  {menuOpen && (
                    <div
                      className="menu-pop"
                      style={{
                        opacity: menuIn,
                        transform: `scale(${0.92 + 0.08 * menuIn})`,
                      }}
                    >
                      <div>Forward</div>
                      <div>Share via email</div>
                      <div className={delHot ? "hot" : ""}>Delete</div>
                      <div>Edit</div>
                    </div>
                  )}
                </span>
              </div>
            )}

            {/* the sent driftwood message */}
            {frame >= T.sent && (
              <div style={{ opacity: sentIn, transform: `translateY(${(1 - sentIn) * 8}px)` }}>
                <div className="msg">
                  <span className="avatar">
                    <Img src={staticFile("yuvan.webp")} />
                  </span>
                  <div>
                    <div className="msg-head">
                      <span className="who">Yuvan Sundrani</span>
                      <span className="when">· 6:57 PM · sent by driftwood</span>
                      <span className="seen">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" />
                          <path d="M4.5 8.2l2.3 2.3 4.7-4.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                      </span>
                    </div>
                    <p className="msg-body">
                      hey CTO, found a bug on your platform. our agents caught your pricing page
                      still promising early access for features lower tiers already have…
                    </p>
                    <div className="clip">
                      <Img src={staticFile("demo-still.webp")} />
                      <span className="play" />
                      {frame >= T.note && frame < T.typing && (
                        <p
                          className="clip-note"
                          style={{
                            opacity:
                              noteIn *
                              interpolate(frame, [T.typing - 10, T.typing], [1, 0], {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                              }),
                            transform: `scale(${0.85 + 0.15 * noteIn})`,
                            transformOrigin: "left top",
                          }}
                        >
                          driftwood built this demo
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {frame >= T.typing - 8 && (
              <div className="divider" style={{ opacity: replyDividerIn }}>
                <hr />
                <span>Jul 10</span>
                <hr />
              </div>
            )}

            {typingOn && (
              <div
                className="msg"
                style={{
                  opacity: typingIn,
                  transform: `translateY(${(1 - typingIn) * 10}px) scale(${0.94 + 0.06 * typingIn})`,
                  transformOrigin: "bottom left",
                }}
              >
                <span className="avatar">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5zm0 2c-4.4 0-9 2.2-9 6.5V24h18v-3.5c0-4.3-4.6-6.5-9-6.5z" />
                  </svg>
                </span>
                <div>
                  <span className="typing-label">CTO is typing</span>
                  <span className="typing">
                    <i style={{ opacity: dot(0) }} />
                    <i style={{ opacity: dot(1) }} />
                    <i style={{ opacity: dot(2) }} />
                  </span>
                </div>
              </div>
            )}

            {frame >= T.reply && (
              <div
                className="msg"
                style={{
                  opacity: replySpring,
                  transform: `translateY(${(1 - replySpring) * 14}px) scale(${0.92 + 0.08 * replySpring})`,
                  transformOrigin: "bottom left",
                }}
              >
                <span className="avatar">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5zm0 2c-4.4 0-9 2.2-9 6.5V24h18v-3.5c0-4.3-4.6-6.5-9-6.5z" />
                  </svg>
                </span>
                <div>
                  <div className="msg-head">
                    <span className="who">CTO</span>
                    <span className="when">· 7:18 AM</span>
                  </div>
                  <p className="msg-body">
                    send me a blurb + demos to ctoemail@startup.com and I'll forward to my
                    team - best
                  </p>
                </div>
              </div>
            )}

            {frame >= T.win && (
              <div className="divider win" style={{ opacity: winIn }}>
                <hr />
                <span>Call booked · Jul 12</span>
                <hr />
              </div>
            )}
          </div>

          {/* compose line: part of the window's furniture, and nothing more.
              It used to carry the paste performance; that beat is cut (see the
              timeline note) because the site masks the card's foot away. */}
          <div className="li-compose">
            <span className="li-input">Write a message…</span>
            <span className="li-send">Send</span>
          </div>
        </div>
      </div>

      <Cursor x={cursorX} y={cursorY} pressed={pressed} opacity={cursorOpacity} />
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="CompareGif"
      component={CompareScene}
      durationInFrames={T.end}
      fps={30}
      width={484}
      height={591}
    />
  );
};
