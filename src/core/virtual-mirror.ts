import Hyperdrive from 'hyperdrive'
import Localdrive from 'localdrive'
import type Corestore from 'corestore'

/**
 * @intent   Mount a collection directory as a Hyperdrive using Localdrive backend.
 * @guarantee Returns a Hyperdrive instance that serves files from the local path with Merkle tree verification.
 * @constraint Uses separate directories for corestore metadata and collection files to avoid conflicts.
 *             Files are mirrored into Hyperdrive's Merkle tree for P2P serving.
 */
export async function mountCollection(
  corestore: Corestore,
  collectionPath: string
): Promise<Hyperdrive> {
  const localdrive = new Localdrive(collectionPath)
  await localdrive.ready()
  const drive = new Hyperdrive(corestore, localdrive)
  return drive
}

/**
 * @intent   Sync files from Localdrive storage into the Hyperdrive's Merkle tree.
 * @guarantee Returns an async iterator that yields sync events.
 * @constraint Requires both the Hyperdrive and Localdrive to be ready.
 */
export async function syncCollection(drive: Hyperdrive, collectionPath: string): Promise<unknown> {
  const localdrive = new Localdrive(collectionPath)
  await localdrive.ready()
  return drive.mirror(localdrive)
}

/**
 * @intent   Unmount a mounted collection (close the Hyperdrive).
 * @guarantee Closes the Hyperdrive and releases resources.
 * @constraint Ensure the drive is fully opened before calling close.
 */
export async function unmountCollection(drive: Hyperdrive): Promise<void> {
  await drive.close()
}