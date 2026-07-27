import type { RepositoryFileSummary } from '../types';

export interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  fileData?: RepositoryFileSummary;
  children: TreeNode[];
}

export function buildFileTree(files: RepositoryFileSummary[]): TreeNode[] {
  const rootNodes: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Sort files by path for predictable tree rendering
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const parts = file.path.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!nodeMap.has(currentPath)) {
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          isFolder: !isFile,
          fileData: isFile ? file : undefined,
          children: []
        };
        nodeMap.set(currentPath, newNode);

        if (i === 0) {
          rootNodes.push(newNode);
        } else {
          const parentPath = parts.slice(0, i).join('/');
          const parentNode = nodeMap.get(parentPath);
          if (parentNode) {
            parentNode.children.push(newNode);
          }
        }
      }
    }
  }

  // Sort folders first, then files
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => {
      if (n.children.length > 0) sortNodes(n.children);
    });
  };

  sortNodes(rootNodes);
  return rootNodes;
}

/**
 * Returns all folder paths leading up to a file path so tree auto-expands on navigation.
 */
export function getParentFolderPaths(filePath: string): string[] {
  const parts = filePath.split('/');
  const folderPaths: string[] = [];
  let current = '';

  for (let i = 0; i < parts.length - 1; i++) {
    current = current ? `${current}/${parts[i]}` : parts[i];
    folderPaths.push(current);
  }

  return folderPaths;
}
