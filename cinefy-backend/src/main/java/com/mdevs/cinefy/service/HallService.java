package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.hall.HallDTO;
import com.mdevs.cinefy.dto.hall.HallDetailDTO;
import com.mdevs.cinefy.dto.hall.HallLayoutDTO;
import com.mdevs.cinefy.dto.hall.HallStatisticsDTO;
import com.mdevs.cinefy.dto.hall.HallSummaryDTO;
import com.mdevs.cinefy.dto.hall.HallTypeDTO;
import com.mdevs.cinefy.dto.hall.SeatLayoutDTO;
import com.mdevs.cinefy.dto.hall.TicketPricingDTO;
import com.mdevs.cinefy.entity.*;
import com.mdevs.cinefy.repository.HallRepository;
import com.mdevs.cinefy.repository.HallTypeRepository;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HallService {

    private final HallRepository hallRepository;

    private final HallTypeRepository hallTypeRepository;

    private final ShowtimeRepository showtimeRepository;

    private static final Pattern POSITION_PATTERN = Pattern.compile("^([A-Z]+)([0-9]+)$");

    // ========================= Hall Types =========================

    public List<HallTypeDTO> getHallTypes() {
        return hallTypeRepository.findAll().stream()
                .map(ht -> {
                    HallTypeDTO dto = new HallTypeDTO();
                    dto.setId(ht.getUuid());
                    dto.setName(ht.getName());
                    return dto;
                })
                .toList();
    }

    @Transactional
    public HallTypeDTO createHallType(HallTypeDTO dto) {
        validateHallType(dto.getName(), null);
        HallType hallType = new HallType(dto.getName());
        hallTypeRepository.save(hallType);
        dto.setId(hallType.getUuid());
        return dto;
    }

    @Transactional
    public HallTypeDTO updateHallType(String uuid, HallTypeDTO dto) {
        HallType hallType = findHallType(uuid);
        validateHallType(dto.getName(), hallType.getId());
        hallType.setName(dto.getName());
        hallType.setCode(HallType.toCode(dto.getName()));
        hallTypeRepository.save(hallType);
        dto.setId(hallType.getUuid());
        return dto;
    }

    @Transactional
    public void deleteHallType(String uuid) {
        HallType hallType = findHallType(uuid);
        if (hallRepository.existsByType(hallType)) {
            throw new BusinessException("Cannot delete hall type '" + hallType.getName() + "' because it is assigned to one or more halls");
        }
        hallTypeRepository.delete(hallType);
    }

    // ============================= Halls ===========================

    public Page<HallSummaryDTO> getHalls(String search, String excludeHallId, String status, Pageable pageable) {
        String code = StringUtils.isEmpty(search) ? null : Hall.toCode(search);
        HallStatus hallStatus = StringUtils.isEmpty(status) ? null : HallStatus.fromString(status);
        Page<Hall> page = hallRepository.findAllFiltered(code, excludeHallId, hallStatus, pageable);
        return page.map(this::toSummaryDTO);
    }

    public HallStatisticsDTO getHallsStatistics() {
        return hallRepository.getStatistics();
    }

    public HallDetailDTO getHall(String uuid) {
        Hall hall = findHall(uuid);

        HallTypeDTO type = new HallTypeDTO();
        type.setId(hall.getType().getUuid());
        type.setName(hall.getType().getName());

        HallDetailDTO dto = new HallDetailDTO();
        dto.setId(hall.getUuid());
        dto.setName(hall.getName());
        dto.setNumberOfRows(hall.getTotalRows());
        dto.setSeatsPerRow(hall.getTotalColumns());
        dto.setStatus(hall.getStatus().name());
        dto.setType(type);
        dto.setSupports3D(hall.isSupports3D());
        dto.setLayout(toLayoutMap(hall));
        dto.setTicketPricing(toPricingList(hall));
        return dto;
    }

    public HallLayoutDTO getHallLayout(String uuid) {
        Hall hall = findHall(uuid);

        HallLayoutDTO dto = new HallLayoutDTO();
        dto.setNumberOfRows(hall.getTotalRows());
        dto.setSeatsPerRow(hall.getTotalColumns());
        dto.setLayout(toLayoutMap(hall));
        dto.setTicketPricing(toPricingList(hall));
        return dto;
    }

    @Transactional
    public HallSummaryDTO createHall(HallDTO dto) {
        validateHall(dto, null);

        Hall hall = new Hall(dto.getName());
        applyDtoToHall(hall, dto);

        hallRepository.save(hall);
        return toSummaryDTO(hall);
    }

    @Transactional
    public HallSummaryDTO updateHall(String uuid, HallDTO dto) {
        Hall hall = findHall(uuid);
        validateHall(dto, hall.getId());
        validateHallMutability(hall, dto);

        hall.setName(dto.getName());
        hall.setCode(Hall.toCode(dto.getName()));
        applyDtoToHall(hall, dto);
        hallRepository.save(hall);

        return toSummaryDTO(hall);
    }

    @Transactional
    public void updateHallStatus(Hall hall, HallStatus status) {
        if (hall.getStatus().equals(status)) return;
        hall.setStatus(status);
        hallRepository.save(hall);
    }

    @Transactional
    public void deleteHall(String uuid) {
        Hall hall = findHall(uuid);
        if (showtimeRepository.existsByHallAndStatusIn(hall, ShowtimeStatus.ACTIVE_STATUSES)) {
            throw new BusinessException("Cannot delete hall '" + hall.getName() + "' while it has active showtimes");
        }
        hallRepository.delete(hall);
    }

    // =========================== Helpers ===========================

    public Hall findHall(String uuid) {
        return hallRepository.findByUuid(uuid).orElseThrow(() -> new NotFoundException("Hall not found: " + uuid));
    }

    private HallType findHallType(String uuid) {
        return hallTypeRepository.findByUuid(uuid).orElseThrow(() -> new NotFoundException("Hall type not found: " + uuid));
    }

    private void validateHallType(String name, Long excludeId) {
        String code = HallType.toCode(name);
        boolean exists = excludeId == null ? hallTypeRepository.existsByCode(code) : hallTypeRepository.existsByCodeAndIdNot(code, excludeId);
        if (exists) {
            throw new BusinessException("A hall type with a similar name to '" + name + "' already exists");
        }
    }

    private void validateHall(HallDTO dto, Long excludeId) {
        String code = Hall.toCode(dto.getName());
        boolean exists = excludeId == null ? hallRepository.existsByCode(code) : hallRepository.existsByCodeAndIdNot(code, excludeId);
        if (exists) {
            throw new BusinessException("A hall with a similar name to '" + dto.getName() + "' already exists");
        }

        Map<String, List<String>> categories = dto.getLayout() != null ? dto.getLayout().getCategories() : null;
        if (categories != null) {
            int totalSeats = dto.getNumberOfRows() * dto.getSeatsPerRow();
            int aisleSeats = categories.getOrDefault(SeatCategory.AISLE.name(), Collections.emptyList()).size();
            if (aisleSeats == totalSeats) {
                throw new BusinessException("A hall cannot have all seats designated as aisles");
            }
        }

        Set<SeatCategory> pricedCategories = EnumSet.noneOf(SeatCategory.class);
        for (TicketPricingDTO pricing : dto.getTicketPricing()) {
            SeatCategory category = SeatCategory.fromString(pricing.getSeatCategory());
            if (!pricedCategories.add(category)) {
                throw new BusinessException("Duplicate seat category entry: " + pricing.getSeatCategory());
            }
            if (category.equals(SeatCategory.AISLE)) {
                throw new BusinessException("Aisle seats cannot have a ticket price");
            }
        }

        Set<SeatCategory> requiredCategories = EnumSet.noneOf(SeatCategory.class);
        if (categories != null) {
            int totalSeats = dto.getNumberOfRows() * dto.getSeatsPerRow();
            int categorizedSeats = categories.values().stream().mapToInt(List::size).sum();
            if (categorizedSeats < totalSeats) {
                requiredCategories.add(SeatCategory.NORMAL);
            }
            categories.keySet().stream()
                    .map(SeatCategory::fromString)
                    .filter(c -> !c.equals(SeatCategory.AISLE))
                    .forEach(requiredCategories::add);
        } else {
            requiredCategories.add(SeatCategory.NORMAL);
        }
        for (SeatCategory required : requiredCategories) {
            if (!pricedCategories.contains(required)) {
                throw new BusinessException("Missing ticket price for seat category: " + required.name());
            }
        }
        for (SeatCategory priced : pricedCategories) {
            if (!requiredCategories.contains(priced)) {
                throw new BusinessException("Ticket price provided for category '" + priced.name() + "' which is not used in this hall");
            }
        }
    }

    private void validateHallMutability(Hall hall, HallDTO dto) {
        // @TODO --> This could be changed to depend on the number of reserved seats instead
        if (!showtimeRepository.existsByHallAndStatusIn(hall, Set.of(ShowtimeStatus.PUBLISHED))) {
            return;
        }
        if (hasCriticalChange(hall, dto)) {
            throw new BusinessException("Cannot modify layout, pricing, or status of hall '" + hall.getName() + "' while it has active showtimes");
        }
    }

    private boolean hasCriticalChange(Hall hall, HallDTO dto) {
        return !hall.getStatus().equals(HallStatus.fromString(dto.getStatus()))
                || hall.getTotalRows() != dto.getNumberOfRows()
                || hall.getTotalColumns() != dto.getSeatsPerRow()
                || isPricingChanged(hall, dto.getTicketPricing())
                || isLayoutChanged(hall, dto.getLayout());
    }

    private boolean isPricingChanged(Hall hall, List<TicketPricingDTO> incoming) {
        Map<SeatCategory, BigDecimal> current = hall.getCategoryPrices().stream()
                .collect(Collectors.toMap(HallCategoryPrice::getCategory, HallCategoryPrice::getTicketPrice));
        Map<SeatCategory, BigDecimal> next = incoming.stream()
                .collect(Collectors.toMap(p -> SeatCategory.fromString(p.getSeatCategory()), TicketPricingDTO::getPrice));
        return !current.equals(next);
    }

    private boolean isLayoutChanged(Hall hall, SeatLayoutDTO incoming) {
        SeatLayoutDTO currentLayout = toLayoutMap(hall);
        Map<String, List<String>> currentCategories = currentLayout.getCategories();
        Map<String, List<String>> incomingCategories = incoming != null && incoming.getCategories() != null ? incoming.getCategories() : Collections.emptyMap();
        if (!categoryMapsEqual(currentCategories, incomingCategories)) return true;

        Set<String> currentOnSiteOnly = new HashSet<>(currentLayout.getOnSiteOnly());
        Set<String> incomingOnSiteOnly = incoming != null && incoming.getOnSiteOnly() != null ? new HashSet<>(incoming.getOnSiteOnly()) : Collections.emptySet();
        return !currentOnSiteOnly.equals(incomingOnSiteOnly);
    }

    private boolean categoryMapsEqual(Map<String, List<String>> a, Map<String, List<String>> b) {
        if (!a.keySet().equals(b.keySet())) return false;
        for (var entry : a.entrySet()) {
            if (!new HashSet<>(entry.getValue()).equals(new HashSet<>(b.get(entry.getKey())))) return false;
        }
        return true;
    }

    private void applyDtoToHall(Hall hall, HallDTO dto) {
        HallType hallType = findHallType(dto.getTypeId());

        hall.setStatus(HallStatus.fromString(dto.getStatus()));
        hall.setType(hallType);
        hall.setSupports3D(dto.isSupports3D());

        mergeCategoryPrices(hall, dto.getTicketPricing());
        mergeSeats(hall, dto.getNumberOfRows(), dto.getSeatsPerRow(), dto.getLayout());
    }

    private void mergeCategoryPrices(Hall hall, List<TicketPricingDTO> pricingList) {
        Map<SeatCategory, HallCategoryPrice> existing = new EnumMap<>(SeatCategory.class);
        for (HallCategoryPrice cp : hall.getCategoryPrices()) {
            existing.put(cp.getCategory(), cp);
        }

        Set<SeatCategory> incoming = EnumSet.noneOf(SeatCategory.class);
        for (TicketPricingDTO pricing : pricingList) {
            SeatCategory category = SeatCategory.fromString(pricing.getSeatCategory());
            incoming.add(category);
            HallCategoryPrice cp = existing.get(category);
            if (cp != null) {
                cp.setTicketPrice(pricing.getPrice());
            } else {
                cp = new HallCategoryPrice();
                cp.setHall(hall);
                cp.setCategory(category);
                cp.setTicketPrice(pricing.getPrice());
                hall.getCategoryPrices().add(cp);
            }
        }

        hall.getCategoryPrices().removeIf(cp -> !incoming.contains(cp.getCategory()));
    }

    private void mergeSeats(Hall hall, int newRows, int newCols, SeatLayoutDTO layoutDTO) {
        Map<String, List<String>> categories = (layoutDTO != null && layoutDTO.getCategories() != null)
                ? layoutDTO.getCategories()
                : Collections.emptyMap();

        Set<String> onSiteOnlySet = (layoutDTO != null && layoutDTO.getOnSiteOnly() != null)
                ? new HashSet<>(layoutDTO.getOnSiteOnly())
                : Collections.emptySet();

        hall.setTotalRows(newRows);
        hall.setTotalColumns(newCols);

        Map<String, SeatCategory> desired = validateAndMapLayout(hall, categories);

        // Validate onSiteOnly positions
        for (String position : onSiteOnlySet) {
            Matcher matcher = POSITION_PATTERN.matcher(position);
            if (!matcher.matches()) {
                throw new BusinessException("Invalid seat position format in onSiteOnly: " + position);
            }
            int rowIndex = toRowIndex(matcher.group(1));
            int colNumber = Integer.parseInt(matcher.group(2));
            if (rowIndex > newRows || colNumber < 1 || colNumber > newCols) {
                throw new BusinessException("onSiteOnly position '" + position + "' is outside the hall grid");
            }
            SeatCategory category = desired.getOrDefault(position, SeatCategory.NORMAL);
            if (category.equals(SeatCategory.AISLE)) {
                throw new BusinessException("AISLE seat '" + position + "' cannot be marked as onSiteOnly");
            }
        }

        for (int row = 1; row <= newRows; row++) {
            String rowLabel = toRowLabel(row);
            for (int col = 1; col <= newCols; col++) {
                desired.putIfAbsent(rowLabel + col, SeatCategory.NORMAL);
            }
        }

        Map<String, Seat> existing = new HashMap<>();
        for (Seat seat : hall.getSeats()) {
            existing.put(seat.getPosition(), seat);
        }

        for (Map.Entry<String, SeatCategory> entry : desired.entrySet()) {
            Seat seat = existing.get(entry.getKey());
            if (seat != null) {
                seat.setCategory(entry.getValue());
                seat.setOnSiteOnly(onSiteOnlySet.contains(entry.getKey()));
            } else {
                Matcher m = POSITION_PATTERN.matcher(entry.getKey());
                m.matches();
                seat = new Seat();
                seat.setHall(hall);
                seat.setRowPosition(m.group(1));
                seat.setColumnPosition(m.group(2));
                seat.setCategory(entry.getValue());
                seat.setOnSiteOnly(onSiteOnlySet.contains(entry.getKey()));
                hall.getSeats().add(seat);
            }
        }

        hall.getSeats().removeIf(seat -> !desired.containsKey(seat.getPosition()));
    }

    private Map<String, SeatCategory> validateAndMapLayout(Hall hall, Map<String, List<String>> layout) {
        Set<SeatCategory> seenCategories = EnumSet.noneOf(SeatCategory.class);
        Map<String, SeatCategory> assignedPositions = new HashMap<>();

        for (Map.Entry<String, List<String>> entry : layout.entrySet()) {
            SeatCategory category = SeatCategory.fromString(entry.getKey());
            if (!seenCategories.add(category)) {
                throw new BusinessException("Duplicate seat category: " + category.name());
            }

            Set<String> seenPositions = new HashSet<>();
            for (String position : entry.getValue()) {
                if (!seenPositions.add(position)) {
                    throw new BusinessException("Seat position '" + position + "' is listed more than once in category: " + category.name());
                }

                Matcher matcher = POSITION_PATTERN.matcher(position);
                if (!matcher.matches()) {
                    throw new BusinessException("Invalid seat position format: " + position);
                }

                int rowIndex = toRowIndex(matcher.group(1));
                int colNumber = Integer.parseInt(matcher.group(2));

                if (rowIndex > hall.getTotalRows()) {
                    throw new BusinessException("Seat position '" + position + "' exceeds the hall's row count (" + hall.getTotalRows() + ")");
                }
                if (colNumber < 1 || colNumber > hall.getTotalColumns()) {
                    throw new BusinessException("Seat position '" + position + "' exceeds the hall's column count (" + hall.getTotalColumns() + ")");
                }
                if (assignedPositions.containsKey(position)) {
                    throw new BusinessException("Seat position '" + position + "' is assigned to multiple categories");
                }

                assignedPositions.put(position, category);
            }
        }

        return assignedPositions;
    }

    private List<TicketPricingDTO> toPricingList(Hall hall) {
        return hall.getCategoryPrices().stream()
                .map(cp -> {
                    TicketPricingDTO pricing = new TicketPricingDTO();
                    pricing.setSeatCategory(cp.getCategory().name());
                    pricing.setPrice(cp.getTicketPrice());
                    return pricing;
                })
                .toList();
    }

    private SeatLayoutDTO toLayoutMap(Hall hall) {
        Map<String, List<String>> categories = hall.getSeats().stream()
                .filter(seat -> !seat.getCategory().equals(SeatCategory.NORMAL))
                .collect(Collectors.groupingBy(
                        seat -> seat.getCategory().name(),
                        Collectors.mapping(
                                Seat::getPosition,
                                Collectors.toList()
                        )
                ));

        List<String> onSiteOnly = hall.getSeats().stream()
                .filter(Seat::isOnSiteOnly)
                .map(Seat::getPosition)
                .toList();

        SeatLayoutDTO dto = new SeatLayoutDTO();
        dto.setCategories(categories);
        dto.setOnSiteOnly(onSiteOnly);
        return dto;
    }

    private HallSummaryDTO toSummaryDTO(Hall hall) {
        HallSummaryDTO summary = new HallSummaryDTO();
        summary.setId(hall.getUuid());
        summary.setName(hall.getName());
        summary.setStatus(hall.getStatus().name());
        summary.setTypeName(hall.getType().getName());
        summary.setSupports3D(hall.isSupports3D());
        summary.setTotalRows(hall.getTotalRows());
        summary.setTotalColumns(hall.getTotalColumns());
        return summary;
    }

    private int toRowIndex(String rowLabel) {
        int index = 0;
        for (int i = 0; i < rowLabel.length(); i++) {
            index = index * 26 + (rowLabel.charAt(i) - 'A' + 1);
        }
        return index;
    }

    private String toRowLabel(int rowIndex) {
        StringBuilder label = new StringBuilder();
        while (rowIndex > 0) {
            rowIndex--;
            label.insert(0, (char) ('A' + rowIndex % 26));
            rowIndex /= 26;
        }
        return label.toString();
    }
}
