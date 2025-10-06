pub mod block;
pub mod blockchain;
pub mod encrypted_data;

// Re-export commonly used types
pub use block::Block;
pub use blockchain::Blockchain;
pub use encrypted_data::EncryptedData;
