export interface Block {
  index: number
  timestamp: number
  encrypted_block_data: string
  blind_indexes: string[]
  block_salt: string
  previous_hash: string
  merkle_root: string
  validator: string
  signature: string
  data_count: number
}

export interface EncryptedData {
  id: string
  user_id: string
  collection_id: string
  encrypted_data: string
  blind_index: string
  created_at: number
}

export interface Collection {
  collection_id: string
  user_id: string
  blind_index: string
  created_at: number
  data_count: number
}

export interface ChainInfo {
  schema_version: string
  chain: Block[]
  node_id: string
  checkpoints: string[]
}

export interface PeerInfo {
  peer_id: string
  address: string
  last_seen: number
}

export interface NetworkStats {
  peer_count: number
  connected_peers: PeerInfo[]
}

export interface ValidatorInfo {
  current_validator: string
  next_validator: string
  block_time: number
}
