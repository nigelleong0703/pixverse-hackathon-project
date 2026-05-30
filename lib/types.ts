export type FrameColor = 'Obsidian Black' | 'Arctic Silver' | 'Sunset Rose'
export type LensType = 'Clear' | 'Transitions'
export type StorageTier = '64GB' | '128GB'
export type Warranty = 'None' | '1 year' | '2 years'

export type ProductConfig = {
  frameColor: FrameColor
  lens: LensType
  storage: StorageTier
  warranty: Warranty
}

export type CartItem = {
  id: string
  sku: string
  name: string
  unitPriceCents: number
  qty: number
  config: ProductConfig
}

export type Comment = {
  id: string
  name: string
  rating: 1 | 2 | 3 | 4 | 5
  message: string
  createdAt: string
}

