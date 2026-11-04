export type MetaTagInjectorInput = {
  title: string
  image?: string
  url: string
  description?: string
}

export function formatTokenMetatagTitleName(symbol: string | undefined, name: string | undefined) {
  if (symbol) {
    return 'Get ' + symbol + ' on MELEH ONE'
  }
  if (name) {
    return 'Get ' + name + ' on MELEH ONE'
  }
  return 'View Token on MELEH ONE'
}

export function formatAuctionMetatagTitleName(symbol: string | undefined, name: string | undefined) {
  if (symbol) {
    return 'Bid on ' + symbol + ' on MELEH ONE'
  }
  if (name) {
    return 'Bid on ' + name + ' on MELEH ONE'
  }
  return 'Bid in a Uniswap auction'
}
