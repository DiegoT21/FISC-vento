package com.fiscvento.campo.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CenterFocusStrong
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.navigation
import androidx.navigation.compose.rememberNavController
import com.fiscvento.campo.ui.ViewModelFactory
import com.fiscvento.campo.ui.ajustes.AjustesScreen
import com.fiscvento.campo.ui.ajustes.AjustesViewModel
import com.fiscvento.campo.ui.escaneo.EscaneoScreen
import com.fiscvento.campo.ui.escaneo.EscaneoViewModel
import com.fiscvento.campo.ui.inventario.InventarioScreen
import com.fiscvento.campo.ui.inventario.InventarioViewModel
import com.fiscvento.campo.ui.login.LoginScreen
import com.fiscvento.campo.ui.login.LoginViewModel
import com.fiscvento.campo.ui.theme.Fisc100
import com.fiscvento.campo.ui.theme.Fisc800

object Routes {
    const val LOGIN = "login"
    const val MAIN = "main"
    const val ESCANEO = "escaneo"
    const val INVENTARIO = "inventario"
    const val AJUSTES = "ajustes"
}

private data class Destino(
    val route: String,
    val label: String,
    val icon: ImageVector,
)

private val destinosPrincipales = listOf(
    Destino(Routes.ESCANEO, "Escaneo", Icons.Filled.CenterFocusStrong),
    Destino(Routes.INVENTARIO, "Inventario", Icons.Filled.Inventory2),
    Destino(Routes.AJUSTES, "Ajustes", Icons.Filled.Settings),
)

@Composable
fun CampoNav(factory: ViewModelFactory) {
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val rutaActual = backStack?.destination?.route
    val enPrincipal = rutaActual in destinosPrincipales.map { it.route }

    Scaffold(
        bottomBar = {
            if (enPrincipal) {
                NavigationBar(tonalElevation = 0.dp) {
                    destinosPrincipales.forEach { destino ->
                        NavigationBarItem(
                            selected = rutaActual == destino.route,
                            onClick = {
                                navController.navigate(destino.route) {
                                    popUpTo(Routes.MAIN) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(destino.icon, contentDescription = destino.label)
                            },
                            label = { Text(destino.label) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Fisc800,
                                selectedTextColor = Fisc800,
                                indicatorColor = Fisc100,
                            ),
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.LOGIN,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.LOGIN) {
                val vm: LoginViewModel = viewModel(factory = factory)
                LoginScreen(
                    viewModel = vm,
                    onLoggedIn = {
                        navController.navigate(Routes.MAIN) {
                            popUpTo(Routes.LOGIN) { inclusive = true }
                        }
                    },
                )
            }
            navigation(
                route = Routes.MAIN,
                startDestination = Routes.ESCANEO,
            ) {
                composable(Routes.ESCANEO) {
                    val vm: EscaneoViewModel = viewModel(factory = factory)
                    EscaneoScreen(viewModel = vm)
                }
                composable(Routes.INVENTARIO) {
                    val vm: InventarioViewModel = viewModel(factory = factory)
                    InventarioScreen(viewModel = vm)
                }
                composable(Routes.AJUSTES) {
                    val vm: AjustesViewModel = viewModel(factory = factory)
                    AjustesScreen(
                        viewModel = vm,
                        onCerrarSesion = {
                            navController.navigate(Routes.LOGIN) {
                                popUpTo(Routes.MAIN) { inclusive = true }
                            }
                        },
                    )
                }
            }
        }
    }
}
