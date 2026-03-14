#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import struct
import sys
import zlib
from pathlib import Path


def paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def parse_png(path: Path) -> tuple[int, int, bytes, int]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
      raise ValueError("not a png file")

    offset = 8
    width = height = 0
    bit_depth = color_type = 0
    idat = bytearray()

    while offset < len(data):
        length = struct.unpack(">I", data[offset:offset + 4])[0]
        chunk_type = data[offset + 4:offset + 8]
        chunk_data = data[offset + 8:offset + 8 + length]
        offset += 12 + length

        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _, _, _ = struct.unpack(">IIBBBBB", chunk_data)
        elif chunk_type == b"IDAT":
            idat.extend(chunk_data)
        elif chunk_type == b"IEND":
            break

    if bit_depth != 8:
        raise ValueError(f"unsupported bit depth: {bit_depth}")

    channels_by_color_type = {
        0: 1,  # grayscale
        2: 3,  # rgb
        4: 2,  # grayscale + alpha
        6: 4,  # rgba
    }
    channels = channels_by_color_type.get(color_type)
    if channels is None:
        raise ValueError(f"unsupported color type: {color_type}")

    return width, height, zlib.decompress(bytes(idat)), channels


def defilter(width: int, height: int, raw: bytes, channels: int) -> list[list[int]]:
    stride = width * channels
    rows: list[list[int]] = []
    offset = 0
    prev_row = [0] * stride

    for _ in range(height):
        filter_type = raw[offset]
        offset += 1
        row = list(raw[offset:offset + stride])
        offset += stride

        if filter_type == 1:
            for i in range(stride):
                left = row[i - channels] if i >= channels else 0
                row[i] = (row[i] + left) & 0xFF
        elif filter_type == 2:
            for i in range(stride):
                row[i] = (row[i] + prev_row[i]) & 0xFF
        elif filter_type == 3:
            for i in range(stride):
                left = row[i - channels] if i >= channels else 0
                up = prev_row[i]
                row[i] = (row[i] + ((left + up) // 2)) & 0xFF
        elif filter_type == 4:
            for i in range(stride):
                left = row[i - channels] if i >= channels else 0
                up = prev_row[i]
                up_left = prev_row[i - channels] if i >= channels else 0
                row[i] = (row[i] + paeth(left, up, up_left)) & 0xFF
        elif filter_type != 0:
            raise ValueError(f"unsupported filter type: {filter_type}")

        rows.append(row)
        prev_row = row

    return rows


def sample_metrics(width: int, height: int, rows: list[list[int]], channels: int) -> dict[str, float | bool]:
    x_start = max(0, width // 10)
    x_end = min(width, width - width // 10)
    y_start = max(0, height // 10)
    y_end = min(height, height - height // 10)

    luminances: list[float] = []
    white_like = 0

    for y in range(y_start, y_end):
        row = rows[y]
        for x in range(x_start, x_end):
            idx = x * channels
            if channels == 1:
                r = g = b = row[idx]
                alpha = 255
            elif channels == 2:
                r = g = b = row[idx]
                alpha = row[idx + 1]
            elif channels == 3:
                r, g, b = row[idx:idx + 3]
                alpha = 255
            else:
                r, g, b, alpha = row[idx:idx + 4]

            if alpha == 0:
                continue

            luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
            luminances.append(luminance)

            if r >= 235 and g >= 235 and b >= 235:
                white_like += 1

    if not luminances:
        raise ValueError("no visible pixels sampled")

    mean = sum(luminances) / len(luminances)
    variance = sum((value - mean) ** 2 for value in luminances) / len(luminances)
    stddev = math.sqrt(variance)
    white_ratio = white_like / len(luminances)

    return {
        "mean_luminance": round(mean, 3),
        "stddev_luminance": round(stddev, 3),
        "white_ratio": round(white_ratio, 5),
        "blank_like": white_ratio > 0.97 and stddev < 6,
    }


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: analyze_png_whiteness.py <png-path>")

    path = Path(sys.argv[1]).expanduser().resolve()
    width, height, raw, channels = parse_png(path)
    rows = defilter(width, height, raw, channels)
    metrics = sample_metrics(width, height, rows, channels)
    metrics["width"] = width
    metrics["height"] = height
    metrics["path"] = str(path)
    print(json.dumps(metrics))


if __name__ == "__main__":
    main()
