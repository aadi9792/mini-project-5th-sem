# Sound asset sources & licensing

Per `00a-visual-assets-and-style-guide.md` §7.1's sourcing policy. All real (non-synthesized)
audio in this folder is CC0/Public Domain, sourced from Wikimedia Commons, then trimmed/
normalized/faded locally into a clean, short loop — none of this is original composition, and none
of it needs attribution, but the source is documented here for transparency (consistent with this
project's honesty rule) and in case it's ever helpful to trace back.

**Honest note on loop quality** (found by actually measuring the files, corrected in `00a` §7.2
rather than left as an overclaim): each file fades to silence at both ends rather than true-
crossfading, so there's a brief audible dip at the loop point when played with `loop=true` — not a
perfectly seamless loop. Accepted as-is for this phase; a future pass could crossfade each file's
tail into its head for a genuinely gapless loop.

| File | Source | Original license | Processing applied |
|---|---|---|---|
| `quiet/rain.ogg`/`.mp3` | [File:Rain.ogg](https://commons.wikimedia.org/wiki/File:Rain.ogg), Wikimedia Commons | Public Domain (author-released) | Trimmed to ~10.4s, fade in/out at loop seam, loudness-normalized |
| `quiet/ocean-waves.ogg`/`.mp3` | [File:Waves.ogg](https://commons.wikimedia.org/wiki/File:Waves.ogg), Wikimedia Commons | Public Domain (author-released) | Trimmed 20s segment (offset 30s), fade in/out, normalized |
| `quiet/gentle-wind.ogg`/`.mp3` | [File:Howling wind.ogg](https://commons.wikimedia.org/wiki/File:Howling_wind.ogg), Wikimedia Commons | CC0 1.0 | Trimmed 15s calmer segment (offset 10s), volume reduced (source is "howling," this needed to read as "gentle"), fade in/out, normalized |
| `quiet/white-noise.ogg`/`.mp3` | [File:White noise.ogg](https://commons.wikimedia.org/wiki/File:White_noise.ogg), Wikimedia Commons | Public Domain (algorithmically generated, no original authorship) | Trimmed to 10s, volume reduced, fade in/out |
| `ambient/jungle.ogg`/`.mp3` | [File:20090610 0 ambience.ogg](https://commons.wikimedia.org/wiki/File:20090610_0_ambience.ogg), Wikimedia Commons (real forest/jungle field recording, Costa Rica) | Public Domain (author-released) | Trimmed 20s segment (offset 15s), fade in/out, normalized |
| `ambient/ocean.ogg`/`.mp3` | Same source as `quiet/ocean-waves` (`File:Waves.ogg`), different segment | Public Domain | Trimmed 20s segment (offset 90s, distinct from the Quiet Sounds clip), fade in/out, normalized |
| `ambient/space.ogg`/`.mp3` | **Not sourced — fully synthesized**, via `ffmpeg`'s `sine`/`anoisesrc` generators (two detuned low sine tones + a very quiet pink-noise bed) | N/A — generated, not a recording | Generated directly as a 20s loop; no real-world "sound of space" exists to honestly record, so synthesis was the more honest choice here specifically (every other ambient track is a real recording; this one deliberately isn't, and should stay that way) |

**Format note:** both `.ogg` and `.mp3` are provided for every file — `.ogg` is the primary format
(better seamless-loop behavior, no encoder-added silence at the file boundary, see `00a` §7.1), but
Safari/iOS does not support Ogg Vorbis playback natively, so `.mp3` exists specifically as its
fallback. Real playback code should provide both via multiple `<audio>` `<source>` elements, never
`.ogg` alone.
