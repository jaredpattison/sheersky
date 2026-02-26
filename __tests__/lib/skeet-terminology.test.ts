import {applySkeetTerminology} from '../../src/locale/skeetTerminology'

describe('applySkeetTerminology', () => {
  // Basic post → skeet replacements
  it('replaces "post" with "skeet"', () => {
    expect(applySkeetTerminology('Write a post')).toBe('Write a skeet')
  })

  it('replaces "Post" with "Skeet"', () => {
    expect(applySkeetTerminology('Post something')).toBe('Skeet something')
  })

  it('replaces "posts" with "skeets"', () => {
    expect(applySkeetTerminology('View all posts')).toBe('View all skeets')
  })

  it('replaces "Posts" with "Skeets"', () => {
    expect(applySkeetTerminology('Posts & Replies')).toBe('Skeets & Replies')
  })

  it('replaces "posted" with "skeeted"', () => {
    expect(applySkeetTerminology('You posted this')).toBe('You skeeted this')
  })

  it('replaces "Posted" with "Skeeted"', () => {
    expect(applySkeetTerminology('Posted 5 minutes ago')).toBe(
      'Skeeted 5 minutes ago',
    )
  })

  it('replaces "posting" with "skeeting"', () => {
    expect(applySkeetTerminology('Keep posting')).toBe('Keep skeeting')
  })

  it('replaces "Posting" with "Skeeting"', () => {
    expect(applySkeetTerminology('Posting is fun')).toBe('Skeeting is fun')
  })

  // Repost → Reskeet replacements
  it('replaces "repost" with "reskeet"', () => {
    expect(applySkeetTerminology('Undo repost')).toBe('Undo reskeet')
  })

  it('replaces "Repost" with "Reskeet"', () => {
    expect(applySkeetTerminology('Repost this')).toBe('Reskeet this')
  })

  it('replaces "reposts" with "reskeets"', () => {
    expect(applySkeetTerminology('5 reposts')).toBe('5 reskeets')
  })

  it('replaces "Reposts" with "Reskeets"', () => {
    expect(applySkeetTerminology('Reposts: 10')).toBe('Reskeets: 10')
  })

  it('replaces "reposted" with "reskeeted"', () => {
    expect(applySkeetTerminology('You reposted this')).toBe(
      'You reskeeted this',
    )
  })

  it('replaces "Reposted" with "Reskeeted"', () => {
    expect(applySkeetTerminology('Reposted by Alice')).toBe(
      'Reskeeted by Alice',
    )
  })

  it('replaces "reposting" with "reskeeting"', () => {
    expect(applySkeetTerminology('Error reposting')).toBe('Error reskeeting')
  })

  it('replaces "Reposting" with "Reskeeting"', () => {
    expect(applySkeetTerminology('Reposting...')).toBe('Reskeeting...')
  })

  // Word boundary protection
  it('does not replace "poster"', () => {
    expect(applySkeetTerminology('movie poster')).toBe('movie poster')
  })

  it('does not replace "compost"', () => {
    expect(applySkeetTerminology('compost bin')).toBe('compost bin')
  })

  it('does not replace "outpost"', () => {
    expect(applySkeetTerminology('outpost location')).toBe('outpost location')
  })

  it('does not replace "postmark"', () => {
    expect(applySkeetTerminology('postmark stamp')).toBe('postmark stamp')
  })

  it('does not replace "apostle"', () => {
    expect(applySkeetTerminology('the apostle')).toBe('the apostle')
  })

  it('does not replace "postpone"', () => {
    expect(applySkeetTerminology('postpone the meeting')).toBe(
      'postpone the meeting',
    )
  })

  // Edge cases
  it('returns empty string unchanged', () => {
    expect(applySkeetTerminology('')).toBe('')
  })

  it('returns string with no matches unchanged', () => {
    expect(applySkeetTerminology('Hello world')).toBe('Hello world')
  })

  it('handles multiple replacements in one string', () => {
    expect(applySkeetTerminology('Your post has 3 reposts')).toBe(
      'Your skeet has 3 reskeets',
    )
  })

  it('handles post at start of string', () => {
    expect(applySkeetTerminology('post')).toBe('skeet')
  })

  it('handles post at end of string', () => {
    expect(applySkeetTerminology('Write a post')).toBe('Write a skeet')
  })

  it('handles post with punctuation', () => {
    expect(applySkeetTerminology('Nice post!')).toBe('Nice skeet!')
    expect(applySkeetTerminology('Is this a post?')).toBe('Is this a skeet?')
    expect(applySkeetTerminology('"post"')).toBe('"skeet"')
  })
})
