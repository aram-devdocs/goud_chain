/// Test to prevent circular dependencies in module structure
///
/// This test parses all Rust source files and builds a dependency graph
/// to detect any circular dependencies between modules.
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;

#[derive(Debug)]
struct DependencyGraph {
    /// Map from module name to list of modules it depends on
    edges: HashMap<String, HashSet<String>>,
}

impl DependencyGraph {
    fn new() -> Self {
        Self {
            edges: HashMap::new(),
        }
    }

    fn add_dependency(&mut self, from: String, to: String) {
        self.edges.entry(from).or_default().insert(to);
    }

    /// Detect circular dependencies using DFS
    fn has_cycle(&self) -> Option<Vec<String>> {
        let mut visited = HashSet::new();
        let mut rec_stack = HashSet::new();
        let mut path = Vec::new();

        for node in self.edges.keys() {
            if !visited.contains(node) {
                if let Some(cycle) = self.dfs_cycle(node, &mut visited, &mut rec_stack, &mut path) {
                    return Some(cycle);
                }
            }
        }
        None
    }

    fn dfs_cycle(
        &self,
        node: &str,
        visited: &mut HashSet<String>,
        rec_stack: &mut HashSet<String>,
        path: &mut Vec<String>,
    ) -> Option<Vec<String>> {
        visited.insert(node.to_string());
        rec_stack.insert(node.to_string());
        path.push(node.to_string());

        if let Some(neighbors) = self.edges.get(node) {
            for neighbor in neighbors {
                if !visited.contains(neighbor) {
                    if let Some(cycle) = self.dfs_cycle(neighbor, visited, rec_stack, path) {
                        return Some(cycle);
                    }
                } else if rec_stack.contains(neighbor) {
                    // Found a cycle! Build the cycle path
                    let cycle_start = path.iter().position(|n| n == neighbor).unwrap();
                    let mut cycle = path[cycle_start..].to_vec();
                    cycle.push(neighbor.to_string());
                    return Some(cycle);
                }
            }
        }

        rec_stack.remove(node);
        path.pop();
        None
    }

    fn print_graph(&self) {
        println!("\n📊 Module Dependency Graph:");
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        let mut modules: Vec<_> = self.edges.keys().collect();
        modules.sort();

        for module in modules {
            if let Some(deps) = self.edges.get(module) {
                if !deps.is_empty() {
                    let mut deps_vec: Vec<_> = deps.iter().map(|s| s.as_str()).collect();
                    deps_vec.sort();
                    println!("  {} → {}", module, deps_vec.join(", "));
                }
            }
        }
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    }
}

/// Parse a Rust file and extract module dependencies
fn parse_dependencies(file_path: &Path, module_name: &str) -> HashSet<String> {
    let content = fs::read_to_string(file_path).unwrap_or_default();
    let mut dependencies = HashSet::new();

    for line in content.lines() {
        let line = line.trim();

        // Match lines like: use crate::module_name::*;
        if line.starts_with("use crate::") {
            if let Some(rest) = line.strip_prefix("use crate::") {
                // Extract the first module name
                if let Some(module) = rest.split("::").next() {
                    let module = module.trim_matches(';').trim();
                    if !module.is_empty() && module != module_name {
                        dependencies.insert(module.to_string());
                    }
                }
            }
        }
    }

    dependencies
}

/// Walk the src directory and build dependency graph
fn build_dependency_graph() -> DependencyGraph {
    let mut graph = DependencyGraph::new();
    let src_dir = Path::new("src");

    // List of top-level modules
    let modules = [
        "api",
        "config",
        "constants",
        "crypto",
        "domain",
        "network",
        "storage",
        "types",
    ];

    for module in &modules {
        let module_path = src_dir.join(module);

        // Check if it's a directory with mod.rs or a single .rs file
        let files_to_check = if module_path.is_dir() {
            // Read all .rs files in the directory
            fs::read_dir(&module_path)
                .unwrap()
                .filter_map(|entry| {
                    let entry = entry.ok()?;
                    let path = entry.path();
                    if path.extension()? == "rs" {
                        Some(path)
                    } else {
                        None
                    }
                })
                .collect::<Vec<_>>()
        } else {
            let file_path = src_dir.join(format!("{}.rs", module));
            if file_path.exists() {
                vec![file_path]
            } else {
                vec![]
            }
        };

        // Aggregate dependencies from all files in the module
        let mut module_deps = HashSet::new();
        for file_path in files_to_check {
            let deps = parse_dependencies(&file_path, module);
            module_deps.extend(deps);
        }

        // Add to graph
        for dep in module_deps {
            graph.add_dependency(module.to_string(), dep);
        }
    }

    graph
}

#[test]
fn test_no_circular_dependencies() {
    println!("\n🔍 Checking for circular dependencies...\n");

    let graph = build_dependency_graph();
    graph.print_graph();

    if let Some(cycle) = graph.has_cycle() {
        panic!(
            "\n❌ CIRCULAR DEPENDENCY DETECTED!\n\n\
            Cycle: {}\n\n\
            This violates the clean architecture principle.\n\
            Please refactor to break the cycle.\n",
            cycle.join(" → ")
        );
    }

    println!("✅ No circular dependencies detected!");
    println!("   Module structure is clean and maintainable.\n");
}

#[test]
fn test_foundation_modules_have_no_dependencies() {
    let graph = build_dependency_graph();

    // Foundation modules should not depend on anything internal
    let foundation_modules = ["constants", "types"];

    for module in &foundation_modules {
        let deps = graph.edges.get(*module).map(|s| s.len()).unwrap_or(0);
        assert_eq!(
            deps,
            0,
            "Foundation module '{}' should have no internal dependencies, but has: {:?}",
            module,
            graph.edges.get(*module)
        );
    }

    println!("✅ Foundation modules are dependency-free!");
}

#[test]
fn test_layered_architecture() {
    let graph = build_dependency_graph();

    // Define layers (lower layers cannot depend on higher layers)
    let layers = [
        vec!["constants", "types"], // Layer 0: Foundation
        vec!["crypto", "config"],   // Layer 1: Utilities
        vec!["domain"],             // Layer 2: Business Logic
        vec!["storage"],            // Layer 3: Persistence
        vec!["network"],            // Layer 4: Network/P2P
        vec!["api"],
    ];

    for (layer_idx, layer) in layers.iter().enumerate() {
        for module in layer {
            if let Some(deps) = graph.edges.get(*module) {
                // Check that this module only depends on lower layers
                for dep in deps {
                    let dep_layer = layers.iter().position(|l| l.contains(&dep.as_str()));

                    if let Some(dep_layer_idx) = dep_layer {
                        assert!(
                            dep_layer_idx < layer_idx,
                            "Layer violation: '{}' (layer {}) depends on '{}' (layer {}). \
                            Modules should only depend on lower layers.",
                            module,
                            layer_idx,
                            dep,
                            dep_layer_idx
                        );
                    }
                }
            }
        }
    }

    println!("✅ Layered architecture is properly maintained!");
}
