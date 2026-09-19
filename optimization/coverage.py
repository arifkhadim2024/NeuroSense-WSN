import numpy as np

def calculate_coverage(
    nodes,
    area_width=100,
    area_height=100,
    sensing_radius=10,
    grid_resolution=2
):
    """
    Calculate the sensing coverage of the active/alive sensor nodes in the WSN.

    Parameters:
    -----------
    nodes : list of dicts or numpy array
        Sensor nodes with 'x', 'y' coordinates (and optionally 'E' > 0).
    area_width : float
        Width of the sensing field (meters).
    area_height : float
        Height of the sensing field (meters).
    sensing_radius : float
        Sensing radius of each node (meters).
    grid_resolution : float
        Step size for grid discretization.

    Returns:
    --------
    float
        Coverage percentage (0.0 to 100.0%).
    """
    if not nodes:
        return 0.0

    # Extract coordinates of active/alive nodes
    coords = []
    for n in nodes:
        if isinstance(n, dict):
            if n.get("E", 1.0) > 0:
                coords.append([n["x"], n["y"]])
        elif hasattr(n, "__len__") and len(n) >= 2:
            coords.append([n[0], n[1]])

    if not coords:
        return 0.0

    node_arr = np.array(coords)  # Shape (N, 2)

    # Discretize the deployment area
    x_ticks = np.arange(0, area_width + 1e-5, grid_resolution)
    y_ticks = np.arange(0, area_height + 1e-5, grid_resolution)
    xx, yy = np.meshgrid(x_ticks, y_ticks)
    grid_points = np.column_stack((xx.ravel(), yy.ravel()))  # Shape (M, 2)
    total_grid_points = grid_points.shape[0]

    # Vectorized distance computation between all grid points and nodes
    # Using chunking if grid is large to maintain memory efficiency
    rs_sq = sensing_radius ** 2
    covered_count = 0
    chunk_size = 1000

    for i in range(0, total_grid_points, chunk_size):
        chunk = grid_points[i:i + chunk_size]  # (C, 2)
        # diffs: (C, N, 2)
        diffs = chunk[:, np.newaxis, :] - node_arr[np.newaxis, :, :]
        dist_sq = np.sum(diffs ** 2, axis=2)  # (C, N)
        is_covered = np.any(dist_sq <= rs_sq, axis=1)  # (C,)
        covered_count += np.sum(is_covered)

    coverage_percentage = (covered_count / total_grid_points) * 100.0
    return float(coverage_percentage)


def get_grid_coverage_mask(
    nodes,
    area_width=100,
    area_height=100,
    sensing_radius=10,
    grid_resolution=2
):
    """
    Returns boolean matrix of shape (num_nodes, total_grid_points) where mask[i, g]
    indicates whether node i covers grid point g.
    """
    if not nodes:
        return np.zeros((0, 0), dtype=bool)

    coords = np.array([[n["x"], n["y"]] if isinstance(n, dict) else [n[0], n[1]] for n in nodes])
    x_ticks = np.arange(0, area_width + 1e-5, grid_resolution)
    y_ticks = np.arange(0, area_height + 1e-5, grid_resolution)
    xx, yy = np.meshgrid(x_ticks, y_ticks)
    grid_points = np.column_stack((xx.ravel(), yy.ravel()))  # (M, 2)

    diffs = coords[:, np.newaxis, :] - grid_points[np.newaxis, :, :]  # (N, M, 2)
    dist_sq = np.sum(diffs ** 2, axis=2)  # (N, M)
    return dist_sq <= (sensing_radius ** 2)
