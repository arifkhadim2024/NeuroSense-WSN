import numpy as np

def calculate_overlap(
    nodes,
    area_width=100,
    area_height=100,
    sensing_radius=10,
    grid_resolution=2
):
    """
    Calculate the sensing overlap ratio among active/alive sensor nodes in the WSN.
    Overlap represents the percentage of covered grid points that are covered
    by more than one active sensor node.

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
        Overlap percentage (0.0 to 100.0%).
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

    if len(coords) <= 1:
        return 0.0

    node_arr = np.array(coords)  # Shape (N, 2)

    # Discretize the deployment area
    x_ticks = np.arange(0, area_width + 1e-5, grid_resolution)
    y_ticks = np.arange(0, area_height + 1e-5, grid_resolution)
    xx, yy = np.meshgrid(x_ticks, y_ticks)
    grid_points = np.column_stack((xx.ravel(), yy.ravel()))  # Shape (M, 2)
    total_grid_points = grid_points.shape[0]

    rs_sq = sensing_radius ** 2
    covered_count = 0
    overlap_count = 0
    chunk_size = 1000

    for i in range(0, total_grid_points, chunk_size):
        chunk = grid_points[i:i + chunk_size]  # (C, 2)
        diffs = chunk[:, np.newaxis, :] - node_arr[np.newaxis, :, :]
        dist_sq = np.sum(diffs ** 2, axis=2)  # (C, N)
        
        # Count sensors covering each grid point in this chunk
        sensors_per_point = np.sum(dist_sq <= rs_sq, axis=1)  # (C,)
        
        covered_in_chunk = np.sum(sensors_per_point >= 1)
        overlap_in_chunk = np.sum(sensors_per_point > 1)
        
        covered_count += covered_in_chunk
        overlap_count += overlap_in_chunk

    if covered_count == 0:
        return 0.0

    overlap_percentage = (overlap_count / covered_count) * 100.0
    return float(overlap_percentage)
