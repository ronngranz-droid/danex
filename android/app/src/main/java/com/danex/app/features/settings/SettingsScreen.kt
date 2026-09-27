package com.danex.app.features.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CropFree
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danex.app.core.designsystem.Amber500
import com.danex.app.core.designsystem.DaneXBluePrimary
import com.danex.app.core.designsystem.Emerald500
import com.danex.app.data.preferences.ClipboardAutomationMode
import com.danex.app.data.preferences.ClipboardFormat
import com.danex.app.domain.model.SolveMode

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onNavigateBack: () -> Unit
) {
    val settings by viewModel.settings.collectAsState()
    var showClearDataDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Pengaturan",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Kembali"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Section 1: Mode Jawaban
            item {
                SettingsSectionHeader(
                    title = "Mode Jawaban",
                    icon = Icons.Default.AutoAwesome
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = if (settings.solveMode == SolveMode.QUICK) "Mode Cepat (Quick)" else "Mode Belajar (Learn)",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = settings.solveMode.description,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = settings.solveMode == SolveMode.LEARN,
                                onCheckedChange = { isLearn ->
                                    viewModel.updateSolveMode(if (isLearn) SolveMode.LEARN else SolveMode.QUICK)
                                },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = MaterialTheme.colorScheme.onPrimary,
                                    checkedTrackColor = MaterialTheme.colorScheme.primary
                                )
                            )
                        }
                    }
                }
            }

            // Section 2: Pemindaian & OCR
            item {
                SettingsSectionHeader(
                    title = "Pemindaian & OCR",
                    icon = Icons.Default.CropFree
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        SettingsToggleRow(
                            title = "OCR Cepat Lokal (On-Device)",
                            subtitle = "Membaca teks secara lokal tanpa upload gambar jika teks sudah jelas.",
                            checked = settings.ocrFastPathEnabled,
                            onCheckedChange = { viewModel.updateOcrFastPath(it) }
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        SettingsToggleRow(
                            title = "Pemrosesan Instan Seleksi Wilayah",
                            subtitle = "Langsung proses saat jari dilepaskan dari kotak seleksi.",
                            checked = settings.instantRegionProcess,
                            onCheckedChange = { viewModel.updateInstantRegionProcess(it) }
                        )
                    }
                }
            }

            // Section 3: Notifikasi & Papan Klip
            item {
                SettingsSectionHeader(
                    title = "Otomatisasi & Papan Klip",
                    icon = Icons.Default.Notifications
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        SettingsToggleRow(
                            title = "Notifikasi Hasil Siap",
                            subtitle = "Tampilkan ringkasan jawaban singkat di panel notifikasi sistem.",
                            checked = settings.notificationDelivery,
                            onCheckedChange = { viewModel.updateNotificationDelivery(it) }
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        SettingsToggleRow(
                            title = "Kartu Jawaban Mengambang",
                            subtitle = "Tampilkan kartu jawaban mengambang di atas aplikasi tanpa harus berpindah layar.",
                            checked = settings.floatingResultEnabled,
                            onCheckedChange = { viewModel.updateFloatingResult(it) }
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Clipboard automation selector
                        Text(
                            text = "Otomatisasi Salin Papan Klip",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "Default nonaktif demi privasi clipboard pengguna.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        var dropdownExpanded by remember { mutableStateOf(false) }
                        ExposedDropdownMenuBox(
                            expanded = dropdownExpanded,
                            onExpandedChange = { dropdownExpanded = !dropdownExpanded }
                        ) {
                            OutlinedTextField(
                                value = settings.clipboardAutomation.displayName,
                                onValueChange = {},
                                readOnly = true,
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = dropdownExpanded) },
                                modifier = Modifier
                                    .menuAnchor()
                                    .fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )
                            ExposedDropdownMenu(
                                expanded = dropdownExpanded,
                                onDismissRequest = { dropdownExpanded = false }
                            ) {
                                ClipboardAutomationMode.entries.forEach { mode ->
                                    DropdownMenuItem(
                                        text = { Text(text = mode.displayName) },
                                        onClick = {
                                            viewModel.updateClipboardAutomation(mode)
                                            dropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        if (settings.clipboardAutomation != ClipboardAutomationMode.OFF) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Format Salin",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            var formatDropdownExpanded by remember { mutableStateOf(false) }
                            ExposedDropdownMenuBox(
                                expanded = formatDropdownExpanded,
                                onExpandedChange = { formatDropdownExpanded = !formatDropdownExpanded }
                            ) {
                                OutlinedTextField(
                                    value = settings.clipboardFormat.displayName,
                                    onValueChange = {},
                                    readOnly = true,
                                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = formatDropdownExpanded) },
                                    modifier = Modifier
                                        .menuAnchor()
                                        .fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp)
                                )
                                ExposedDropdownMenu(
                                    expanded = formatDropdownExpanded,
                                    onDismissRequest = { formatDropdownExpanded = false }
                                ) {
                                    ClipboardFormat.entries.forEach { fmt ->
                                        DropdownMenuItem(
                                            text = { Text(text = fmt.displayName) },
                                            onClick = {
                                                viewModel.updateClipboardFormat(fmt)
                                                formatDropdownExpanded = false
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Section 4: Privasi
            item {
                SettingsSectionHeader(
                    title = "Privasi & Data",
                    icon = Icons.Default.Security
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        SettingsToggleRow(
                            title = "Simpan Tangkapan Layar",
                            subtitle = "Default nonaktif. Tangkapan layar diproses di memori dan dihapus.",
                            checked = settings.retainScreenshots,
                            onCheckedChange = { viewModel.updateRetainScreenshots(it) }
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        TextButton(
                            onClick = { showClearDataDialog = true },
                            colors = androidx.compose.material3.ButtonDefaults.textButtonColors(
                                contentColor = MaterialTheme.colorScheme.error
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.DeleteOutline,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "Hapus Semua Data & Riwayat Lokal")
                        }
                    }
                }
            }

            // Section 5: Tentang Aplikasi & AI Budget
            item {
                SettingsSectionHeader(
                    title = "Kuota AI & Tentang DaneX",
                    icon = Icons.AutoMirrored.Filled.Assignment
                )
                Spacer(modifier = Modifier.height(8.dp))

                // AI Token Budget Card
                val usageStats by viewModel.usageStats.collectAsState()
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Kuota Token AI Gateway",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            val statusColor = when {
                                usageStats?.isLimitExceeded == true -> MaterialTheme.colorScheme.error
                                usageStats?.isNearLimit == true -> Amber500
                                else -> Emerald500
                            }
                            val statusText = when {
                                usageStats?.isLimitExceeded == true -> "Batas Tercapai"
                                usageStats?.isNearLimit == true -> "Peringatan 80%"
                                else -> "Normal"
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(statusColor.copy(alpha = 0.15f))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = statusText,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = statusColor
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        val progress = ((usageStats?.totalTokens ?: 0).toFloat() / 1_000_000f).coerceIn(0f, 1f)
                        androidx.compose.material3.LinearProgressIndicator(
                            progress = progress,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = if (progress > 0.8f) Amber500 else DaneXBluePrimary,
                            trackColor = MaterialTheme.colorScheme.surfaceVariant
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Terpakai: ${usageStats?.totalTokens ?: 0} / 1.000.000",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "Sisa: ${usageStats?.remainingTokens ?: 1_000_000}",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "DaneX v1.0.0 (Production Architecture)",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Universal Study Assistant • Select. Scan. Solve.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Privasi ketat: tidak merekam layar di latar belakang, tidak membypass FLAG_SECURE, API key terlindung di server.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    if (showClearDataDialog) {
        AlertDialog(
            onDismissRequest = { showClearDataDialog = false },
            title = { Text(text = "Hapus Semua Data?") },
            text = { Text(text = "Semua riwayat dan pengaturan lokal akan direset ke bawaan.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.clearAllUserData {
                            showClearDataDialog = false
                        }
                    }
                ) {
                    Text(text = "Hapus", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearDataDialog = false }) {
                    Text(text = "Batal")
                }
            }
        )
    }
}

@Composable
private fun SettingsSectionHeader(
    title: String,
    icon: ImageVector
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )
    }
}

@Composable
private fun SettingsToggleRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = MaterialTheme.colorScheme.onPrimary,
                checkedTrackColor = MaterialTheme.colorScheme.primary
            )
        )
    }
}
